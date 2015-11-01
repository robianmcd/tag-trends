import {Component, View, ElementRef, Input, Output, EventEmitter, FORM_DIRECTIVES} from 'angular2/core';

declare var Awesomplete: any;

@Component({
    selector: 'typeahead'
})
@View({
    template: '<input class="typeahead"/>',
    directives: [FORM_DIRECTIVES]
})
export class Typeahead {
    @Input() getMatches;
    @Output() matchSelected = new EventEmitter();

    private selectedText: string;
    private awesomplete;
    private input: HTMLInputElement;
    private searchTerm: string;

    constructor(elementRef: ElementRef) {
        this.input = elementRef.nativeElement.getElementsByTagName('input')[0];
        this.awesomplete = new Awesomplete(this.input, {
            list: [],
            minChars: 1,
            autoFirst: true,
            //Maintains the original order
            sort: (a,b) => {return -1},
            //Use the selected text instead of the user input so the selection does not change while the user is typing
            //or while the server is responding.
            filter: (text, userInput) => {
                return text.toLowerCase().indexOf(this.searchTerm.toLowerCase()) !== -1;
            },
            item: (text, userInput) => {
                var htmlStr;
                if(this.searchTerm) {
                    htmlStr = text.replace(new RegExp(this.searchTerm, 'g'), `<mark>${this.searchTerm}</mark>`);
                } else {
                    htmlStr = this.searchTerm;
                }
                var element = document.createElement('li');
                element.innerHTML = htmlStr;
                return element;
            }
        });

        var clickTypeaheadStream = (<Rx.Observable<any>>Rx.Observable.fromEvent(this.input, 'click'))
            .map(() => this.input.value);

        clickTypeaheadStream.subscribe(() => {
            //If there is text in the input box then this will open the typeahead
            this.awesomplete.evaluate();
        });

        //For some reason typeScript has a bunch of issues with this if I don't cast it to any
        (<any>Rx.Observable.fromEvent(this.input, 'input'))
            .map(event => event.target.value)
            .filter((text) => {
                //if the text changed because the user just selected a match then don't reload the matches.
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
            .debounce(200)
            .flatMapLatest((term) => {
                return this.getMatches(term).then((matches) => {
                    this.searchTerm = term;
                    return matches;
                })
            })
            .map((matchingTags: any[]) => {
                return matchingTags.map(tag => tag.name);
            })
            .subscribe((matchingTags) => {
                this.awesomplete.list = matchingTags;
                this.awesomplete.evaluate();
            });

        this.input.addEventListener('awesomplete-selectcomplete', (event) => {
            this.selectedText = event.target['value'];
            this.matchSelected.next(this.selectedText);
        });
    }

    clear() {
        this.input.value = '';
        this.searchTerm = '';
        this.selectedText = '';
        this.awesomplete.list = [];
        this.awesomplete.evaluate();
    }

}
