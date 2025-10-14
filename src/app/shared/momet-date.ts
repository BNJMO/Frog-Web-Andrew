import {Pipe, PipeTransform} from '@angular/core';
import moment from "moment";


@Pipe({name: 'momentDate'})
export class MomentDatePipe implements PipeTransform {
    transform(date: any, format: string): any {
        if (date) {
            return moment(date).format(format);
        }
    }
}
