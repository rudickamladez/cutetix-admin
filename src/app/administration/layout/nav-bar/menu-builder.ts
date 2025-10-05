import { faCalendarDays, faClock, faTicket } from '@fortawesome/free-solid-svg-icons';
import { MenuItem, MenuSubItem } from './menu-items';
import { IconDefinition } from '@fortawesome/angular-fontawesome';

export class MenuBuilder {
    constructor() { }

    build(): MenuItem[] {

        return [
            this.getMenuItem('Tickets', 'tickets', faTicket, () => this.getTicketsSubItems()),
            this.getMenuItem('Ticket groups', 'ticket_groups', faClock, () => this.getSubItemsByPath('ticket_groups')),
            this.getMenuItem('Events', 'events', faCalendarDays, () => this.getSubItemsByPath('events')),
        ].filter(o => o);
    }

    getSubItemsByPath(
        path: string = 'events'
    ): MenuSubItem[] {
        const result: MenuSubItem[] = [];
        result.push(new MenuSubItem('List', `/${path}/list`));
        result.push(new MenuSubItem('New', `/${path}/add`));
        return result;
    }

    getTicketsSubItems(): MenuSubItem[] {
        const result: MenuSubItem[] = [];
        result.push(new MenuSubItem('List', '/tickets/list'));
        result.push(new MenuSubItem('New', '/tickets/add'));
        return result;
    }

    private getMenuItem(
        name: string, defaultLink: string, icon: IconDefinition, getSubItems: () => MenuSubItem[]
    ): MenuItem {
        const menuItem = new MenuItem(name, defaultLink, icon);
        menuItem.subItems.push(...getSubItems());
        return menuItem;
    }
}
