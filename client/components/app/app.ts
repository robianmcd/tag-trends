import {Component, View, ViewChildren, QueryList, CORE_DIRECTIVES, FORM_DIRECTIVES} from 'angular2/core';

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
    directives: [Typeahead, TagComponent, TagChart, CORE_DIRECTIVES, FORM_DIRECTIVES],
    template: `
        <div class="app">
            <typeahead #typeahead [get-matches]="boundGetMatchingTags" (match-selected)="matchingTagSelected($event, typeahead)" class="tag-search"></typeahead>
            <div>
                <tag *ng-for="#tag of selectedTags; #i = index"
                    [color]="getColor(i)" [tag]="tag" (remove)="removeTag(tag)">
                </tag>
            </div>
            <tag-chart [colors]="colors" [tags]="selectedTags"></tag-chart>
        </div>
    `,
    styles: [`
        .app {
            padding: 10px;
        }
    `]

})
export class App {
    labels:string[];
    typeahead;
    tagSearchText:string;
    selectedTags:Tag[] = [];
    boundGetMatchingTags:Function;

    tagChart:TagChart;
    @ViewChildren(TagChart) tagChartQueryList:QueryList<TagChart>;

    webStormFullCyclePallet = ['#D47366', '#6891D4', '#E5F26D', '#AA68D4', '#68D474', '#D46891', '#68C7D4', '#D4AA68', '#7468D4', '#91D468', '#D468C7', '#68D4AA'];
    PrimaryColorPallet = ['#E62D2E', '#357DB7', '#F6EA04', '#794496', '#029968', '#F39927', '#CA0789', '#0BA0C2', '#FCCC12', '#5159A4', '#97C230', '#EC6E2A'];

    //Sample url to test colors: http://localhost:3000/?tags=[java,javascript,html,css,jquery,python,php,objective-c,asp.net-mvc,android,iphone,ruby-on-rails]
    colors = this.webStormFullCyclePallet;


    constructor(private urlUtil:UrlUtil, private api:Api) {
        this.boundGetMatchingTags = this.getMatchingTags.bind(this);
    }

    afterViewInit() {
        this.tagChart = this.tagChartQueryList.first;
        this.initializeAppFromQueryParams();
    }

    initializeAppFromQueryParams() {
        var tagNames:string[] = this.urlUtil.getSearchParams()['tags'] || [];

        Promise.all(tagNames.map(tagName => this.api.getTagByName(tagName)))
            .then((tags:Tag[]) => {
                this.selectedTags = tags;
            })
            .catch((err) => {
                console.log('Could not find tag.', err);
                this.urlUtil.setSearchParam('tags', [], false);
                this.selectedTags = [];
            })
            .then(() => {
                this.tagChart.createForRange(moment('2008-08', 'YYYY-MM'), moment());
            });
    }

    getColor(index) {
        return this.colors[index % this.colors.length]
    }

    getMatchingTags(query:string) {
        return this.api.getMatchingTags(query);
    }

    matchingTagSelected(tagName:string, typeahead:Typeahead) {
        this.api.getTagByName(tagName)
            .then((tag) => {
                this.tagSearchText = '';
                this.selectedTags.push(tag);
                this.updateTagsQueryParam();
                this.tagChart.addTagToChart(tag);
                typeahead.clear();
            })
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
}
