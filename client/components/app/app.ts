import {Component, View, ViewChild, QueryList} from 'angular2/core';

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
    directives: [Typeahead, TagComponent, TagChart, Header],
    template: `
        <div id="tag-trends">
            <tt-header></tt-header>
            <div class="content" [class.tag-has-been-selected]="tagHasBeenSelected">
                <div class="tag-search">
                    <typeahead #typeahead [get-matches]="boundGetMatchingTags" (match-selected)="matchingTagSelected($event, typeahead)"></typeahead>
                </div>

                <!--The tag chart renders outside it's container when it is hidden unless it is inside a div inside the content div that is never hidden... :( -->
                <!--TLDR: don't remove this div-->
                <div>
                    <div [hidden]="!selectedTags.length">
                        <div class="tags">
                            <tag *ng-for="#tag of selectedTags; #i = index"
                                 [color]="getColor(i)" [tag]="tag" (remove)="removeTag(tag)">
                            </tag>
                        </div>
                        <div>
                            <span class="heading desktop-only">Questions over time</span>
                            <span class="mc-tooltip desktop-only">
                                <span  class="fa fa-question-circle" style="font-size:18px; color: grey;"></span>
                                <span class="mc-tooltip-content">
                                    <img class="mc-tooltip-callout" src="img/callout.gif" />
                                    {{getTooltipText()}}
                                </span>
                            </span>

                            <label class="relative-label">
                                Relative:
                                <input class="relative-check-box" type="checkbox" [checked]="relative" (click)="relativeClicked()">
                            </label>
                        </div>
                        <tag-chart></tag-chart>
                        <span class="stack-exchange-plug mobile-only">
                            Powered by the Stack Exchange Network's API.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        #tag-trends {
            background-color: #ededed;
            display: flex;
            flex-flow: column;
            height: 100%;
        }

        tt-header {
            flex: 0 1 auto;
        }

        .content {
            flex: 1 1 auto;
            max-width: 768px;
            width: 100%;
            margin: auto;
            padding: 10px;
            padding-top: 20vh;
            transition: all 0.4s ease;
        }

        .content.tag-has-been-selected {
            background-color: white;
        }

        .tag-search {
            margin-bottom: 5px;
        }

        .heading {
            font-size: 20px;
        }

        .relative-check-box {
            position: relative;
            top: 2px;
        }

        @media screen and (min-width: 481px) {
            .content.tag-has-been-selected {
                padding-top: 20px;
            }

            .tags {
                margin-bottom: 20px;
            }

            .relative-label {
                float: right;
            }
        }

        @media screen and (max-width: 480px) {
            .content.tag-has-been-selected {
                padding-top: 5px;
            }

            .stack-exchange-plug {
                font-size: 10px;
                color: #999999;
            }
        }
    `]

})
export class App {
    relative:boolean = true;
    labels:string[];
    typeahead;
    tagHasBeenSelected = false;
    selectedTags:Tag[] = [];
    boundGetMatchingTags:Function;

    @ViewChild(TagChart) tagChart:TagChart;

    webStormFullCyclePallet = ['#D47366', '#6891D4', '#68D474', '#AA68D4', '#E5F26D', '#D46891', '#68C7D4', '#D4AA68', '#7468D4', '#91D468', '#D468C7', '#68D4AA'];
    PrimaryColorPallet = ['#E62D2E', '#357DB7', '#F6EA04', '#794496', '#029968', '#F39927', '#CA0789', '#0BA0C2', '#FCCC12', '#5159A4', '#97C230', '#EC6E2A'];

    //Sample url to test colors: http://localhost:3000/?tags=[java,javascript,html,css,jquery,python,php,objective-c,asp.net-mvc,android,iphone,ruby-on-rails]
    colors = this.webStormFullCyclePallet;


    constructor(private urlUtil:UrlUtil, private api:Api) {
        this.boundGetMatchingTags = this.getMatchingTags.bind(this);

        //Occurs when the user clicks back or forward.
        window.addEventListener("popstate", () => {
            this.initializeAppFromQueryParams();
        });
    }

    //Will be called after this.tagChart is initialized.
    ngAfterViewInit() {
        this.initializeAppFromQueryParams();
    }

    initializeAppFromQueryParams() {
        var searchParams = this.urlUtil.getSearchParams();
        var tagNames:string[] = searchParams['tags'] || [];
        if (tagNames.length) {
            this.tagHasBeenSelected = true;
        }

        if (searchParams['relative'] === 'true') {
            this.relative = true;
        }
        else if (searchParams['relative'] === 'false') {
            this.relative = false;
        }

        Promise.all(tagNames.map(tagName => this.api.getTagByName(tagName)))
            .then((tags:Tag[]) => {
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

    getMatchingTags(query:string) {
        return this.api.getMatchingTags(query);
    }

    matchingTagSelected(tagName:string, typeahead:Typeahead) {
        this.tagHasBeenSelected = true;
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

    getTooltipText() {
        var relativeDependantText;

        if (this.relative) {
            relativeDependantText = 'percentage';
        } else {
            relativeDependantText = 'number';
        }

        return `Shows the ${relativeDependantText} of StackOverflow questions asked each month with a given tag. This data comes from the Stack Exchange Network's API.`;
    }
}
