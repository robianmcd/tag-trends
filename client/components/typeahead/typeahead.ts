import {Component, View, ElementRef, Input, Output, EventEmitter} from 'angular2/core';

declare var Awesomplete: any;

@Component({
    selector: 'typeahead',
})
@View({
    template: `<input/>`,
})
export class Typeahead {
    @Input() getMatches;
    @Output() matchSelected = new EventEmitter();

    awesomplete;
    input: HTMLInputElement;
    selectedText: string;

    constructor(elementRef: ElementRef) {
        this.input = elementRef.nativeElement.getElementsByTagName('input')[0];
        this.awesomplete = new Awesomplete(this.input, {
            list: ['aaa', 'aab', 'aac'],
            //Maintains the original order
            sort: (a,b) => {return -1}
        });

        var clickTypeaheadStream = (<Rx.Observable<any>>Rx.Observable.fromEvent(this.input, 'click'))
            .map(() => this.input.value);

        //For some reason typeScript has a bunch of issues with this if I don't cast it to any
        (<any>Rx.Observable.fromEvent(this.input, 'keyup'))
            .map(event => event.target.value)
            .filter((text) => {
                //if the text changed because the user just selected a match then done reload the matches.
                if(this.selectedText === text) {
                    return false;
                } else {
                    this.selectedText = '';
                    return true;
                }
            })
            .merge(clickTypeaheadStream)
            .map(text => text.trim())
            .filter(text => text.length > 0)
            .distinctUntilChanged()
            .debounce(250)
            .flatMapLatest((term) => {
                return this.getMatches(term);
            })
            .map((matchingTags: any[]) => {
                return matchingTags.map(tag => tag.name);
            })
            .subscribe((matchingTags) => {
                console.log(matchingTags);
                this.awesomplete.list = matchingTags;
                this.awesomplete.evaluate();
                this.awesomplete.goto(0);
            });

        this.input.addEventListener('awesomplete-selectcomplete', (event) => {
            this.selectedText = event.target['value'];
            this.matchSelected.next(this.selectedText);
            //Call output
        });
    }

}
