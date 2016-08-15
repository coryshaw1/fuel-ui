import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";

import {FuiDirectivesModule} from "./directives";

import {AnimationDemo} from "./animation/animation.demo";
import {TooltipDemo} from "./tooltip/tooltip.demo";
import {CodeHighlighterDemo} from "./codeHighlighter/codeHighlighter.demo";

export * from "./animation/animation.demo";
export * from "./tooltip/tooltip.demo";
export * from "./codeHighlighter/codeHighlighter.demo";

const directivesDemoProviders = [
    AnimationDemo,
    TooltipDemo,
    CodeHighlighterDemo
]

@NgModule({
    imports: [
        CommonModule,
        FuiDirectivesModule
    ],
    exports: directivesDemoProviders
})
export class FuiDirectivesDemoModule { }