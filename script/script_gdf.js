function getArgByHalfMethod(fun, trgtFunVal, xLimLeft, xLimRight, maxIter, accuracy) {
    let acc = accuracy !== undefined ? accuracy : 1e-9;
    let yLeft = fun(xLimLeft),
        yRight = fun(xLimRight);
    if (Math.abs(trgtFunVal - yLeft) < acc) {
        return xLimLeft;
    }
    if (Math.abs(trgtFunVal - yRight) < acc) {
        return xLimRight;
    }
    let xLeft = xLimLeft,
        xRight = xLimRight,
        x, y;
    let currIter = 0;
    while (Math.abs(xRight - xLeft) > acc && currIter < maxIter) {
        x = (xLeft + xRight) * 0.5;
        y = fun(x);
        if ((y - trgtFunVal) * (yRight - trgtFunVal) < 0) {
            xLeft = x;
            continue;
        }
        //        if ((yLeft - trgtFunVal)*(y - trgtFunVal) < 0) {} - TODO if not, throw Exception
        xRight = x;
        currIter += 1;
    }
    return (xLeft + xRight) * 0.5;
}


function splitElementsBy(elementFieldName, elements) {
    //    let elementsByClassNames = new Map();
    let fieldValueVsElement = new Map();
    for (let element of elements) {
        //        elementsByClassNames.set(item.name, item);
        fieldValueVsElement.set(element[elementFieldName], element);
    }
    return fieldValueVsElement;
}

class GasStateByMach {
    constructor() {
        this.kappa = 1.4;
        this.mach = 1.0;
    }
    
    setKappa(kappa) {
        this.kappa = +kappa;
    }

    getArgMin() {
        return 0.0;
    }

    getArgMax() {
        return Infinity;
    }

    setArgument(mach) {
        this.mach = +mach;
    }

    getArgFieldName() {
        return 'mach';
    }

    getMach() {
        return this.mach;
    }

    getQu() {
        return Math.pow((this.kappa + 1.0) / 2.0, 1.0 / (this.kappa - 1.0)) * this.getLambda() * Math.pow(1.0 - (this.kappa - 1.0) / (this.kappa + 1.0) * Math.pow(this.getLambda(), 2.0), 1.0 / (this.kappa - 1.0));
    }

    getLambda() {
        //        return Math.sqrt(Math.pow(this.mach,2.)*(this.kappa+1.)/2./(1.+(this.kappa-1.)/2.*Math.pow(this.mach,2.)));
        return Math.sqrt(Math.pow(this.mach, 2) * (this.kappa + 1) / 2 / (1 + (this.kappa - 1) / 2 * Math.pow(this.mach, 2)));
    }

    getPi() {
        return 1.0 / this.getPiInverse();
    }

    getPiInverse() {
        return Math.pow(this.getTauInverse(), this.kappa / (this.kappa - 1.0));
    }

    getEpsilon() {
        return 1.0 / this.getRoInverse();
    }

    getRoInverse() {
        return Math.pow(this.getTauInverse(), 1.0 / (this.kappa - 1.0));
    }

    getTau() {
        return 1.0 / this.getTauInverse();
    }

    getTauInverse() {
        return 1.0 + (this.kappa - 1.0) / 2.0 * Math.pow(this.mach, 2.0);
    }

}

class GasStateByLambda {
    constructor() {
        this.kappa = 1.4;
        this.lambda = 1.0;
    }
    
    setKappa(kappa) {
        this.kappa = +kappa;
    }

    getArgMin() {
        return 0.0;
    }

    getArgMax() {
        return this.getLambdaMax();
    }

    setArgument(lambda) {
        this.lambda = +lambda;
    }

    getArgFieldName() {
        return 'lambda';
    }

    getLambda() {
        return this.lambda;
    }

    getLambdaMax() {
        return Math.sqrt((this.kappa + 1.0) / (this.kappa - 1.0));
    }

    getMach() {
        return Math.sqrt(2.0 * Math.pow(this.lambda, 2.0) / (this.kappa + 1.0 - Math.pow(this.lambda, 2.0) * (this.kappa - 1.0)));
    }

    getPi() {
        return Math.pow(this.getEpsilon(), this.kappa);
    }

    getEpsilon() {
        return Math.pow(this.getTau(), 1.0 / (this.kappa - 1.0));
    }

    getTau() {
        return 1.0 - (this.kappa - 1.0) / (this.kappa + 1.0) * Math.pow(this.lambda, 2.0);
    }

    getQu() {
        return this.lambda * this.getEpsilon() * Math.pow((this.kappa + 1.0) / 2.0, 1.0 / (this.kappa - 1.0));
    }
}


class GasStateDelegate {
    constructor(wrappedState) {
        this.wrappedState = wrappedState;
    }
    setKappa(kappa) {
        this.wrappedState.setKappa(kappa);
        this.kappa = this.wrappedState.kappa;
    }
    getMach() {
        return this.wrappedState.getMach();
    }
    getLambda() {
        return this.wrappedState.getLambda();
    }
    getPi() {
        return this.wrappedState.getPi();
    }
    getEpsilon() {
        return this.wrappedState.getEpsilon();
    }
    getTau() {
        return this.wrappedState.getTau();
    }
    getQu() {
        return this.wrappedState.getQu();
    }
    getArgMin() {
        return 0.0;
    }
    getArgMax() {
        return 1.0;
    }
}

class GasStateByQu extends GasStateDelegate {
    constructor() {
        super(new GasStateByLambda());
        this.funQuByLambda = function (lambda) {
            this.setArgument(lambda);
            return this.getQu();
        };
        this.funQuByLambda = this.funQuByLambda.bind(this.wrappedState);
        this.setSubsound();
        this.maxIter = 5000;
    }

    setSubsound() {
        this.leftLyambda = 0.0;
        this.rightLyambda = 1.0;
    }

    setSupersound() {
        this.leftLyambda = 1.0;
        this.rightLyambda = this.wrappedState.getLambdaMax();
    }

    setArgument(qu) {
        this.qu = +qu;
        this.wrappedState.setArgument(
            getArgByHalfMethod(this.funQuByLambda, this.qu, this.leftLyambda, this.rightLyambda, this.maxIter)
        );
    }

    getArgFieldName() {
        return 'qu';
    }

    getQu() {
        return this.qu;
    }
}

class GasStateByPi extends GasStateDelegate {
    constructor() {
        //        super(new GasStateByMach());
        super(new GasStateByLambda());
    }

    setArgument(pi) {
        this.pi = +pi;
        this.wrappedState.setArgument(
            //            this._getMach(this.kappa, this.pi)
            this._getLambda(this.kappa, this.pi)
        );
    }

    getArgFieldName() {
        return 'pi';
    }

    _getMach(k, pi) {
        return Math.sqrt((Math.pow(1.0 / pi, (k - 1.0) / k) - 1.0) * 2.0 / (k - 1.0));
    }

    _getLambda(k, pi) {
        return Math.sqrt((1 - Math.pow(pi, (k - 1.0) / k)) * (k + 1.0) / (k - 1.0));
    }

    getPi() {
        return this.pi;
    }
}

class GasStateByTau extends GasStateDelegate {
    constructor() {
        //        super(new GasStateByMach());
        super(new GasStateByLambda());
    }

    setArgument(tau) {
        this.tau = +tau;
        this.wrappedState.setArgument(
            //            this._getMach(this.kappa, this.tau)
            this._getLambda(this.kappa, this.tau)
        );
    }

    getArgFieldName() {
        return 'tau';
    }

    _getMach(k, tau) {
        return Math.sqrt((1.0 / tau - 1.0) * 2.0 / (k - 1.0));
    }

    _getLambda(k, tau) {
        return Math.sqrt((1.0 - tau) * (k + 1.0) / (k - 1.0));
    }

    getTau() {
        return this.tau;
    }

}

class GasStateByEpsilon extends GasStateDelegate {
    constructor() {
        //        super(new GasStateByMach());
        super(new GasStateByLambda());
    }

    setArgument(epsilon) {
        this.epsilon = +epsilon;
        this.wrappedState.setArgument(
            this._getLambda(this.kappa, this.epsilon)
        );
    }

    getArgFieldName() {
        return 'epsilon';
    }

    _getMach(k, epsilon) {
        return Math.sqrt((Math.pow(1.0 / this.epsilon, k - 1.0) - 1.0) * 2.0 / (k - 1.0));
    }

    _getLambda(k, epsilon) {
        return Math.sqrt((1.0 - Math.pow(epsilon, k - 1.0)) * (k + 1.0) / (k - 1.0));
    }

    getEpsilon() {
        return this.epsilon;
    }
}

class GasStateUpdater {
    constructor(fieldsAndGetters) {
        this.fieldsAndGetters = fieldsAndGetters;
    }

    update(state, methodsOwner) {
        methodsOwner.setKappa(state.get('kappa'));
        let argFieldName = methodsOwner.getArgFieldName(); // cache
        let actualArgVal = state.get(argFieldName);
        methodsOwner.setArgument(actualArgVal);
        for (let [fieldName, getterName] of this.fieldsAndGetters.entries()) {
            state.set(fieldName, methodsOwner[getterName]());
        }
        state.set(argFieldName, actualArgVal); // cache
        return state;
    }
}

class ModelGdf {
    constructor() {
        this.nameVsGasStateProcessor = new Map([
            ['mach', new GasStateByMach()],
            ['lambda', new GasStateByLambda()],
            ['pi', new GasStateByPi()],
            ['tau', new GasStateByTau()],
            ['epsilon', new GasStateByEpsilon()],
            ['qu', new GasStateByQu()]
        ]);
        this.gasStateUpdater = new GasStateUpdater(new Map([
            ['mach', 'getMach'],
            ['lambda', 'getLambda'],
            ['pi', 'getPi'],
            ['tau', 'getTau'],
            ['epsilon', 'getEpsilon'],
            ['qu', 'getQu']
        ]));
        this.gasState = new Map();
        this.maxKappaVal = 5. / 3.; // https://en.wikipedia.org/wiki/Heat_capacity_ratio
        this.__initState();
    }

    __initState() {
        this.setField('mach', 1.0);
        this.setKappa(1.4);
    }

    setField(name, value) {
        this.activeStateProcessor = this.nameVsGasStateProcessor.get(name);
        let numVal = +value;
        if (numVal < this.activeStateProcessor.getArgMin()) {
            numVal = this.activeStateProcessor.getArgMin();
        }
        if (numVal > this.activeStateProcessor.getArgMax()) {
            numVal = this.activeStateProcessor.getArgMax();
        }
        this.gasState.set(name, numVal);
        this.update();
    }

    setKappa(value) {
        this.gasState.set('kappa', value);
        let kappaVal = +value;
        if (kappaVal < 1.0) {
            this.gasState.set('kappa', '1.0');
        }
        if (kappaVal > this.maxKappaVal) {
            this.gasState.set('kappa', this.maxKappaVal);
        }
        this.update();
    }
    
    update() {
        this.gasStateUpdater.update(this.gasState, this.activeStateProcessor);
        this.actualizeQu();
    }
    
    actualizeQu() {
        if (this.gasState.get('mach') < 1) {
            this.nameVsGasStateProcessor.get('qu').setSubsound();
            return;
        }
        if (this.gasState.get('mach') > 1) {
            this.nameVsGasStateProcessor.get('qu').setSupersound();
            return;
        }
    }

    setSubsound() {
        this.nameVsGasStateProcessor.get('qu').setSubsound();
        this.setField('qu', this.activeStateProcessor.getQu());
    }

    setSupersound() {
        this.nameVsGasStateProcessor.get('qu').setSupersound();
        this.setField('qu', this.activeStateProcessor.getQu());
    }

    getActiveState() {    
        return this.gasState;
    }
}

class ModelSettings {
    constructor() {
        this.settings = new Map();
    }

    setField(name, value) {
        this.settings.set(name, value);
    }

    formatValueOnOuput(value) {
        let mantissaSize = +this.settings.get('mantissa_size');
        let notation = this.settings.get('notation');
        let formattedValue;
        if (notation == 'scientific') {
            formattedValue = (+value).toExponential(mantissaSize);
        } else {
            formattedValue = (+value).toFixed(mantissaSize);
        }
        formattedValue = this.replaceSeparator(formattedValue);
        formattedValue = formattedValue.replace(this.regexDelTrailZeros, '');
        return formattedValue;
    }

    formatValueOnInput(value) {
        return this.replaceSeparator(value);
    }

    replaceSeparator(value) {
        let separator = this.settings.get('decimal_separator');
        return value.toString().replace(/[\.\,]/g, separator);
    }
}


class LimiterInputOfHtmlPattern {
    constructor(input) {
        this.pattern = new RegExp(input.pattern);
    }

    limit(prev, curr) {
        if (this.pattern.test(curr)) {
            return curr;
        }
        return prev;
    }
}

class LimiterInputOfHtmlValue {
    constructor(input) {
        this.min = +input.min;
        this.max = +input.max;
    }

    limit(prev, curr) {
        let currVal = +curr;
        if (currVal < this.min) {
            return this.min;
        }
        if (currVal > this.max) {
            return this.max;
        }
        return curr;
    }
}

class LimitedInput {
    constructor(input) {
        this.input = input;
        this.limiters = [
            new LimiterInputOfHtmlPattern(input),
        ];
        if (input.hasAttribute('min') && input.hasAttribute('max')) {
            this.limiters.push(new LimiterInputOfHtmlValue(input));
        }
        let onInput = this.onInput.bind(this);
        input.addEventListener('input', onInput);
    }

    updateValue() {
        this.currValue = this.input.value;
        this.prevValue = this.input.value;
    }

    onInput() {
        this.currValue = this.input.value;
        for (let limiter of this.limiters) {
            this.currValue = limiter.limit(this.prevValue, this.currValue);
        }
        this.prevValue = this.currValue;
        this.input.value = this.currValue;
    }
}

class ControllerBasic {
    constructor(inputs, model) {
        this.model = model;
        this.inputs = inputs;
        this.namesVsInputs = splitElementsBy('name', inputs);
        this.initEvents();
    }

    initEvents() {
        let onInput = this.onInput.bind(this);
        for (let input of this.namesVsInputs.values()) {
            input.addEventListener('change', onInput);
        }
    }

    setCurrValsToModel() {
        for (let [name, input] of this.namesVsInputs) {
            this.model.setField(name, input.value);
        }
    }

    onInput(e) {
        let input = e.target;
        let name = input.name;
        let value = input.value;
        this.model.setField(name, value);
    }
}

class ControllerFormSettings {
    constructor(settingsModel) {
        this.dependentControllers = []
        this.settingsModel = settingsModel;
        this.controllerInputs = document.getElementsByClassName("setting_input");
        this.base = new ControllerBasic(this.controllerInputs, settingsModel);
        this.base.setCurrValsToModel();
        this.initEvents();
    }

    addDependentController(dependentController) {
        if (this.dependentControllers.includes(dependentController)) {
            return
        }
        this.dependentControllers.push(dependentController)
    }

    initEvents() {
        let onInput = this.onInput.bind(this);
        for (let input of this.controllerInputs) {
            input.addEventListener('change', onInput);
        }
    }

    onInput(e) {
        this.update()
    }

    update() {
        for (let dependentController of this.dependentControllers) {
            dependentController.update();
        }
    }
}


class ControllerFormGdf {

    constructor(modelSettings) {
        this.modelSettings = modelSettings;
        this.modelGdf = new ModelGdf();
        let inputs = document.getElementsByClassName("gdf_input");
        this.namesVsInputs = splitElementsBy('name', inputs);
        this.namesVsLimitedInputs = new Map();
        let flowSpeedElements = document.getElementsByName('flow_speed');
        this.radios = splitElementsBy('id', flowSpeedElements);
        this.currInput = undefined;
        this.__initEvents();
        this.update();
        this.__updatePrevValues();
        this.__initMachSelector();
    }

    __initEvents() {
        let updateSwitcherState = this.updateSwitcherStateByMachVal.bind(this);
        let onFocusIn = this.onFocusIn.bind(this);
        let onFocusOut = this.onFocusOut.bind(this);
        let onInput = this.onInput.bind(this);
        for (let [name, input] of this.namesVsInputs.entries()) {
            this.namesVsLimitedInputs.set(name, new LimitedInput(input));
            input.addEventListener('focusin', onFocusIn);
            input.addEventListener('focusout', onFocusOut);
            input.addEventListener('input', onInput);
        }
        let subsoundChecked = this.subsoundChecked.bind(this);
        this.radios.get('subsound').addEventListener('change', subsoundChecked);
        let supersoundChecked = this.supersoundChecked.bind(this);
        this.radios.get('supersound').addEventListener('change', supersoundChecked);
    }
    
    __initMachSelector() {
        let val = this.modelGdf.getActiveState().get('mach');
        if (!this.radios.get('subsound').checked && !this.radios.get('supersound').checked && val == 1) {
            this.radios.get('subsound').checked = true;
            return;
        }
    }

    __updatePrevValues() {
        for (let limitedInput of this.namesVsLimitedInputs.values()) {
            limitedInput.updateValue();
        }
    }

    onFocusIn(e) {
        this.currInput = e.target;
        this.namesVsInputs.delete(this.currInput.name);
    }

    onFocusOut(e) {
        this.namesVsInputs.set(this.currInput.name, this.currInput);
        this.update();
    }

    onInput(e) {
        let input = e.target;
        let name = input.name;
        let value = this.modelSettings.formatValueOnInput(input.value);
        if (name == 'kappa') {
            this.modelGdf.setKappa(value);
        } else {
            this.modelGdf.setField(name, value);
        }
        this.update();
    }

    update() {
        let state = this.modelGdf.getActiveState();
        for (let [name, input] of this.namesVsInputs.entries()) {
            input.value = this.modelSettings.formatValueOnOuput(state.get(name));
        }
        this.updateSwitcherStateByMachVal();
    }

    updateSwitcherStateByMachVal() {
        let state = this.modelGdf.getActiveState();
        let val = +state.get('mach');
        if (val < 1) {
            this.radios.get('subsound').checked = true;
            return;
        }
        if (val > 1) {
            this.radios.get('supersound').checked = true;
            return;
        }
    }

    subsoundChecked() {
        this.modelGdf.setSubsound();
        this.update();
    }

    supersoundChecked() {
        this.modelGdf.setSupersound();
        this.update();
    }
}

/*
    TODO 200525
        1. tooltips
        2. graphs
*/

let modelSettings = new ModelSettings();
let controllerSettings = new ControllerFormSettings(modelSettings);
let controller = new ControllerFormGdf(modelSettings);
controllerSettings.addDependentController(controller);
