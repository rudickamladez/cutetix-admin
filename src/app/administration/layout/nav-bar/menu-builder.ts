import { faCalendarDays, faClock, faTicket } from '@fortawesome/free-solid-svg-icons';
import { MenuItem, MenuSubItem } from './menu-items';
import { IconDefinition } from '@fortawesome/angular-fontawesome';
import { inject } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

export class MenuBuilder {
    readonly #auth = inject(AuthService);
    #defaultMenu: MenuItem[] = [
        this.#getMenuItem('My events', 'events', faCalendarDays, () => this.getSubItemsByPath('events')),
    ].filter(o => o);

    build(): MenuItem[] {
        let scopes = this.#auth.getScopes();
        let username = this.#auth.getUsername();
        if (scopes.includes("admin") || username.includes("admin") /*|| username.includes("matuska")*/) {
            // user is admin and should have access to all things
            return [
                this.#getMenuItem('Tickets', 'tickets', faTicket, () => this.getSubItemsByPath('tickets')),
                this.#getMenuItem('Ticket groups', 'ticket_groups', faClock, () => this.getSubItemsByPath('ticket_groups')),
                this.#getMenuItem('Events', 'events', faCalendarDays, () => this.getSubItemsByPath('events')),
            ].filter(o => o);
        }

        // user has restricted access
        return this.#defaultMenu;
    }

    getSubItemsByPath(
        path: string = 'events'
    ): MenuSubItem[] {
        const result: MenuSubItem[] = [];
        result.push(new MenuSubItem('List', `/${path}/list`));
        result.push(new MenuSubItem('New', `/${path}/add`));
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
