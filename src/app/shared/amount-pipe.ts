import {Pipe, PipeTransform} from '@angular/core';
import { DecimalPipe } from '@angular/common';
@Pipe({
    name: 'kAmount'
})
export class AmountPipe implements PipeTransform {
    constructor(private decimalPipe: DecimalPipe ) {
    }

    transform(num, arg): Object {
        const threshold = arg.split('/')[0];
        const digitsInfo =  arg.split('/')[1];
        let precision = digitsInfo.split('-')[1];
        if (threshold < num) {
            if (!precision) {
                precision = 1;
            }
            if (num > 999 && num < 999999) {
                return this.decimalPipe.transform(num / 1000) + 'k';
            } else if (num > 999999) {
                return this.decimalPipe.transform(num / 1000000) + 'm';
            } else {
                return this.decimalPipe.transform(num, digitsInfo);
            }
        } else {
            return this.decimalPipe.transform(num, digitsInfo);
        }


    }
}
