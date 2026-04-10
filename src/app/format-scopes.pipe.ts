import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatScopes',
  // pure: false, // TODO: Check
})
export class FormatScopesPipe implements PipeTransform {

  transform(scopes: string | string[] | undefined): string {
    if (!scopes) return '';
    if (typeof scopes === 'string'){
      if (scopes.includes(',')) {
        scopes = scopes.split(',');
      } else {
        return scopes.trim();
      }
    }
    return scopes
      .map(s => s.trim())
      .sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()))
      .join(', ');
  }

}
