import { faCalendarDay, faCalendarDays, faClock, faTicket } from '@fortawesome/free-solid-svg-icons';
import { MenuItem, MenuSubItem } from './menu-items';
import { IconDefinition } from '@fortawesome/angular-fontawesome';
import { inject } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { AdminModeService } from 'src/app/services/adminMode.service';

export class MenuBuilder {
    readonly #auth = inject(AuthService);
    readonly #adminMode = inject(AdminModeService);


    #defaultMenu: MenuItem[] = [
        this.#getMenuItem('My events', 'my-events', faCalendarDay, () => this.getSubItemsByPath('my-events')),
    ].filter(o => o);

    ticketsMenuItem: MenuItem = this.#getMenuItem('Tickets', 'tickets', faTicket, () => this.getSubItemsByPath('tickets'));
    ticketGroupsMenuItem: MenuItem = this.#getMenuItem('Ticket groups', 'ticket_groups', faClock, () => this.getSubItemsByPath('ticket_groups'));
    eventsMenuItem: MenuItem = this.#getMenuItem('Events', 'events', faCalendarDays, () => this.getSubItemsByPath('events'));
    #adminMenu: MenuItem[] = [
        this.ticketsMenuItem,
        this.ticketGroupsMenuItem,
        this.eventsMenuItem,
    ];

    build(currentUrl: string = ''): MenuItem[] {
        if (this.#adminMode.status()) {
            // user is admin and should have access to all things
            return this.#adminMenu.filter(o => o);
        }

        // user has restricted access
        let menu: MenuItem[] = [];

        // add menu item when user opened some page defaultly not in menu
        for (let i = 0; i < this.#adminMenu.length; i++) {
            const menuItem = this.#adminMenu[i];
            if (currentUrl.startsWith(`/${menuItem.link}`)) {
                menu.push(menuItem);
            }
        }

        // return merged menu
        return [
            ...menu,
            ...this.#defaultMenu,
        ].filter(o => o);
    }

    getSubItemsByPath(
        path: string = 'events'
    ): MenuSubItem[] {
        const result: MenuSubItem[] = [];
        result.push(new MenuSubItem('List', `/${path}/list`));

        if (this.#adminMode.status() || this.#auth.getScopes().includes(`${path}:edit`)) {
            result.push(new MenuSubItem('New', `/${path}/add`));
        }
        return result;
    }

    getUsersSubItems(): MenuSubItem[] {
        const result: MenuSubItem[] = [];
        result.push(new MenuSubItem('List', '/users/list'));
        result.push(new MenuSubItem('New', '/users/add'));
        return result;
    }

    #getMenuItem(
        name: string, defaultLink: string, icon: IconDefinition, getSubItems: () => MenuSubItem[]
    ): MenuItem {
        const menuItem = new MenuItem(name, defaultLink, icon);
        menuItem.subItems.push(...getSubItems());
        return menuItem;
    }
}
