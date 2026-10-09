import { IconDefinition } from "@fortawesome/angular-fontawesome";

export class MenuSubItem {
    constructor(
        public name: string,
        public link: string
    ) {}
}

export class MenuItem extends MenuSubItem {
    public subItems: MenuSubItem[];

    constructor(
        public override name: string,
        public override link: string,
        public icon: IconDefinition,
        public customFunc?: () => void
    ) {
        super(name, link);
        this.subItems = [];
    }

    withSubItem(name: string, link: string): MenuItem {
        this.subItems.push(new MenuSubItem(name, link));
        return this;
    }
}
