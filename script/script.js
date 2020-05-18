
function splitElementsByArrOf(elementFieldNameArr, elements) {
    // example of elementFieldNameArr: ['attributes', 'name', 'value'] for tagName 'div'
    let elementsByFieldNames = {};
    let name = '';
    for (let element of elements) {
        name = element;
        for (let elementFieldName of elementFieldNameArr) {
            name = name[elementFieldName];
        }
        elementsByFieldNames[name] = element;
    }
    return elementsByFieldNames;
}

class TabVisibility {

    constructor() {
        this.tabContent = document.getElementsByClassName("tab_content");
        this.nameVsTabContent = splitElementsByArrOf(['attributes', 'name', 'value'], this.tabContent);
        this.tabs = document.getElementsByClassName("tab");
        this.initEvents();
        document.getElementById('tab_opened_by_default').click();
    }

    initEvents() {
        let tabVisibility = this.tabVisibility.bind(this);
        for (let tab of this.tabs) {
            tab.addEventListener('click', tabVisibility);
        }
    }

    tabVisibility(event) {
        let tabName = event.target.name;
        for (let i = 0; i < this.tabContent.length; i++) {
            this.tabContent[i].style.display = "none";
        }

        for (let i = 0; i < this.tabs.length; i++) {
            this.tabs[i].className = this.tabs[i].className.replace(" tab_active", "");
        }
        this.nameVsTabContent[tabName].style.display = "block";
        event.currentTarget.className += " tab_active";
    }
}


let tabVisibility = new TabVisibility();

