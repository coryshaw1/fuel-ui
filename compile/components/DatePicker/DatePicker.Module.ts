import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {FuiInfiniteScrollerModule} from "../InfiniteScroller/InfiniteScroller";

export {DatePickerCalendar}  from "./DatePickerCalendar";
export {DatePicker} from "./DatePicker";
export {DatePickerField, DatePickerFieldStyler} from "./DatePickerField";
export {DateRangePicker, StartDateField, EndDateField} from "./DateRangePicker";

import {DatePickerCalendar}  from "./DatePickerCalendar";
import {DatePicker} from "./DatePicker";
import {DatePickerField, DatePickerFieldStyler} from "./DatePickerField";
import {DateRangePicker, StartDateField, EndDateField} from "./DateRangePicker";

const datePickerDirectives = [
    DatePicker,
    DatePickerCalendar,
    DatePickerField,
    DatePickerFieldStyler,
    DateRangePicker,
    StartDateField,
    EndDateField
]

@NgModule({
    imports: [CommonModule, FormsModule, FuiInfiniteScrollerModule],
    declarations: datePickerDirectives,
    exports: datePickerDirectives
})
export class FuiDatePickerModule { }