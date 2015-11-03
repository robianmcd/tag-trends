import {Component, View, Input, Output, EventEmitter} from 'angular2/core';
import {Tag} from "../../models/tag";

@Component({
    selector: 'tag',
    providers: []
})
@View({
    directives: [],
    template: `
        <div class="tag" [style.border-color]="color" [style.background-color]="color">
            <div class="tag-container">
                <div class="tag-name">
                    {{tag.name}}
                </div>
                <div (click)="removeTag(tag)" class="remove-button">x</div>
            </div>
        </div>
    `,
    styles: [`
        .tag {
            display: inline-block;
            margin: 3px 3px 3px 0;
            border-style: solid;
            border-width: 1px;
        }

        .tag-container {
            background-color: rgba(250,250,250,0.8);
        }

        .tag .tag-name {
            padding: 4px 0 4px 4px;
            display: inline-block;
        }

        .tag .remove-button {
            padding: 4px 11px;
            background-color: rgba(100,100,100,0.1);
            cursor: pointer;
            display: inline-block;
        }
    `]
})
export class TagComponent {
    @Input() color: string;
    @Input() tag: Tag;
    @Output() remove = new EventEmitter();

    private removeTag() {
        this.remove.next(this.tag);
    }
}