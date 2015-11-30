import {Component, View, ViewChild, QueryList, CORE_DIRECTIVES, FORM_DIRECTIVES} from 'angular2/core';

import {Header} from "../header/header";
import {Typeahead} from '../typeahead/typeahead';
import {TagComponent} from '../tag/tag';
import {TagChart} from '../tagChart/tagChart';

import {UrlUtil} from '../../services/urlUtil';
import {Api} from '../../services/api';

import {Tag} from '../../models/tag';

import Moment = moment.Moment;


@Component({
    selector: 'app',
    providers: [UrlUtil, Api]
})
@View({
    directives: [Typeahead, TagComponent, TagChart, Header, CORE_DIRECTIVES, FORM_DIRECTIVES],
    template: `
        <div id="tag-trends">
            <tt-header></tt-header>
            <div class="content">
                <typeahead #typeahead [get-matches]="boundGetMatchingTags" (match-selected)="matchingTagSelected($event, typeahead)" class="tag-search"></typeahead>
                <div>
                    <label>
                        Relative:
                         <input type="checkbox" [checked]="relative" (click)="relativeClicked()">
                    </label>
                </div>
                <div>
                    <tag *ng-for="#tag of selectedTags; #i = index"
                        [color]="getColor(i)" [tag]="tag" (remove)="removeTag(tag)">
                    </tag>
                </div>
                <tag-chart></tag-chart>
            </div>
        </div>
    `,
    styles: [`
        .content {
            padding: 10px;
        }
    `]

})
export class App {
    relative: boolean = true;
    labels: string[];
    typeahead;
    selectedTags: Tag[] = [];
    boundGetMatchingTags: Function;

    @ViewChild(TagChart) tagChart: TagChart;

    webStormFullCyclePallet = ['#D47366', '#6891D4', '#E5F26D', '#AA68D4', '#68D474', '#D46891', '#68C7D4', '#D4AA68', '#7468D4', '#91D468', '#D468C7', '#68D4AA'];
    PrimaryColorPallet = ['#E62D2E', '#357DB7', '#F6EA04', '#794496', '#029968', '#F39927', '#CA0789', '#0BA0C2', '#FCCC12', '#5159A4', '#97C230', '#EC6E2A'];

    //Sample url to test colors: http://localhost:3000/?tags=[java,javascript,html,css,jquery,python,php,objective-c,asp.net-mvc,android,iphone,ruby-on-rails]
    colors = this.webStormFullCyclePallet;


    constructor(private urlUtil: UrlUtil, private api: Api) {
        this.boundGetMatchingTags = this.getMatchingTags.bind(this);

        //Occurs when the user clicks back or forward.
        window.addEventListener("popstate", () => {
            this.initializeAppFromQueryParams();
        });
    }

    //Will be called after this.tagChart is initialized.
    afterViewInit() {
        this.initializeAppFromQueryParams();
    }

    initializeAppFromQueryParams() {
        var searchParams = this.urlUtil.getSearchParams();
        var tagNames: string[] = searchParams['tags'] || [];
        if (searchParams['relative'] === 'true') {
            this.relative = true;
        }
        else if (searchParams['relative'] === 'false') {
            this.relative = false;
        }

        Promise.all(tagNames.map(tagName => this.api.getTagByName(tagName)))
            .then((tags: Tag[]) => {
                this.selectedTags = tags;
            })
            .catch((err) => {
                console.error('Could not find tag.', err);
                this.urlUtil.setSearchParam('tags', [], false);
                this.selectedTags = [];
            })
            .then(() => {
                this.tagChart.recreate(moment('2008-08', 'YYYY-MM'), moment(), this.selectedTags, this.colors, this.getDataField());
            });
    }

    getColor(index) {
        return this.colors[index % this.colors.length];
    }

    getMatchingTags(query: string) {
        return this.api.getMatchingTags(query);
    }

    matchingTagSelected(tagName: string, typeahead: Typeahead) {
        typeahead.clear();

        //If the tag hasn't already been added.
        if (this.selectedTags.some(tag => tag.name === tagName) === false) {
            this.api.getTagByName(tagName)
                .then((tag) => {
                    this.selectedTags.push(tag);
                    this.updateTagsQueryParam();
                    this.tagChart.addTagToChart(tag);
                })
        }
    }

    removeTag(tag) {
        var tagIndex = this.selectedTags.indexOf(tag);
        if (tagIndex !== -1) {
            this.selectedTags.splice(tagIndex, 1);
            this.updateTagsQueryParam();
            this.tagChart.removeTagFromChart(tag);
        }
    }

    updateTagsQueryParam() {
        this.urlUtil.setSearchParam('tags', this.selectedTags.map(tag => tag.name), false);
    }

    relativeClicked() {
        this.relative = !this.relative;
        this.urlUtil.setSearchParam('relative', this.relative, false);

        this.tagChart.changeDataField(this.getDataField());
    }

    getDataField() {
        return this.relative ? 'percentQuestions' : 'numQuestions';
    }
}
