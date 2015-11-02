import {Component, View, CORE_DIRECTIVES, FORM_DIRECTIVES} from 'angular2/core';
import {Typeahead} from "../typeahead/typeahead";
import {UrlUtil} from '../../services/urlUtil';
import {Api} from '../../services/api';
import {Tag} from "../../models/tag";
import Moment = moment.Moment;

declare var c3:any;

@Component({
    selector: 'app',
    providers: [UrlUtil, Api]
})
@View({
    directives: [Typeahead, CORE_DIRECTIVES, FORM_DIRECTIVES],
    template: `
        <typeahead #typeahead [get-matches]="boundGetMatchingTags" (match-selected)="matchingTagSelected($event, typeahead)"></typeahead>
        <ul>
            <li *ng-for="#tag of selectedTags">
                <div>
                    {{tag.name}}
                </div>
                <button (click)="removeTag(tag)">X</button>
            </li>
        </ul>
        <div id="chart"></div>
    `

})
export class App {
    labels:string[];
    typeahead;
    chart;
    tagSearchText:string;
    selectedTags:Tag[] = [];
    boundGetMatchingTags:Function;


    constructor(private urlUtil:UrlUtil, private api:Api) {
        this.initializeAppFromQueryParams();
        this.boundGetMatchingTags = this.getMatchingTags.bind(this);
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
                this.labels = this.generateLabels(moment('2008-08-01'), moment());

                this.chart = c3.generate({
                    data: {
                        x: 'x',
                        xFormat: '%Y-%m', // 'xFormat' can be used as custom format of 'x'
                        columns: []
                    },
                    axis: {
                        x: {
                            type: 'timeseries',
                            tick: {
                                fit: false,
                                format: '%Y-%b'
                            },
                            padding: {left: 0, right: 0}
                        },
                        y: {
                            show: false,
                            padding: {top: 10, bottom: 0},
                        }
                    },
                    legend: {
                        show: false
                    },
                    tooltip: {
                        format: {
                            title: function (x) {
                                return `# of Questions (${moment(x).format('MMM YYYY')})`
                            }
                        }
                    },
                    zoom: {
                        enabled: true
                    },
                    point: {
                        show: true,
                        r: 0,
                        focus: {
                            expand: {
                                r: 5
                            }
                        }
                    },
                    line: {
                        step: {
                            type: 'step'
                        }
                    }
                });
                this.selectedTags.forEach((tag) => {
                    this.addTagToChart(tag);
                });
            });
    }

    addTagToChart(tag:Tag) {
        var chartData = this.generateArray(moment('2008-08-01'), moment(), tag);
        var series = (<any>[tag.name]).concat(chartData.data);

        //For some reason the labels can't be added to the chart until there is another column to add to the chart so
        // /we're just adding it every time another tag is added.
        this.chart.load({
            columns: [
                ['x'].concat(this.labels),
                series
            ],
            colors: {}
        });

    }

    removeTagFromChart(tag:Tag) {
        this.chart.unload({
            ids: [tag.name]
        });
    }


    generateArray(startDate:Moment, endDate:Moment, tag:Tag) {
        var curDate = moment(startDate);

        var labels = [];

        while (curDate.isBefore(endDate)) {
            labels.push(curDate.format('YYYY-MM'));
            curDate.add(1, 'month');
        }

        var data = labels.map(function (label) {
            if (tag.usageByMonth[label]) {
                return tag.usageByMonth[label].numQuestions;
            } else {
                return 0;
            }
        });

        return {data: data, labels: labels};
    }

    generateLabels(startDate:Moment, endDate:Moment) {
        var curDate = moment(startDate);

        var labels = [];

        while (curDate.isBefore(endDate)) {
            labels.push(curDate.format('YYYY-MM'));
            curDate.add(1, 'month');
        }

        return labels;
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
                this.addTagToChart(tag);
                typeahead.clear();
            })
    }

    removeTag(tag) {
        var tagIndex = this.selectedTags.indexOf(tag);
        if (tagIndex !== -1) {
            this.selectedTags.splice(tagIndex, 1);
            this.updateTagsQueryParam();
            this.removeTagFromChart(tag);
        }
    }

    updateTagsQueryParam() {
        this.urlUtil.setSearchParam('tags', this.selectedTags.map(tag => tag.name), false);
    }
}
