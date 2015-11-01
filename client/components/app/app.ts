import {Component, View, CORE_DIRECTIVES, FORM_DIRECTIVES} from 'angular2/core';
import {Typeahead} from "../typeahead/typeahead";
import {UrlUtil} from '../../services/urlUtil';
import {Api} from '../../services/api';
import {Tag} from "../../models/tag";
import Moment = moment.Moment;

declare var Chart:any;

@Component({
    selector: 'app',
    providers: [UrlUtil, Api]
})
@View({
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
        <div style="width: 1000px;">
            <canvas id="myChart"></canvas>
        </div>
    `,
    directives: [Typeahead, CORE_DIRECTIVES, FORM_DIRECTIVES]
})
export class App {

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
                this.rebuildChart(this.selectedTags);
            });
    }


    rebuildChart(tags:Tag[]) {
        var ctx = document.getElementById("myChart");

        const BASE_DATASET = {
            // Boolean - if true fill the area under the line
            fill: false,

            // String - the color to fill the area under the line with if fill is true
            backgroundColor: "rgba(220,220,220,0.2)",

            // The properties below allow an array to be specified to change the value of the item at the given index

            // String or array - Line color
            borderColor: "rgba(220,220,220,1)",

            // String - cap style of the line. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineCap
            borderCapStyle: 'butt',

            // Array - Length and spacing of dashes. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
            borderDash: [],

            // Number - Offset for line dashes. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineDashOffset
            borderDashOffset: 0.0,

            // String - line join style. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin
            borderJoinStyle: 'miter',

            // String or array - Point stroke color
            pointBorderColor: "rgba(220,220,220,1)",

            // String or array - Point fill color
            pointBackgroundColor: "#fff",

            // Number or array - Stroke width of point border
            pointBorderWidth: 1,

            // Number or array - Radius of point when hovered
            pointHoverRadius: 5,

            // String or array - point background color when hovered
            pointHoverBackgroundColor: "rgba(220,220,220,1)",

            // Point border color when hovered
            pointHoverBorderColor: "rgba(220,220,220,1)",

            // Number or array - border width of point when hovered
            pointHoverBorderWidth: 2,

            // String - If specified, binds the dataset to a certain y-axis. If not specified, the first y-axis is used.
            yAxisID: "y-axis-1",
        };

        var labels = [];

        var datasets = tags.map((tag:Tag) => {
            var chartData = this.generateArray(moment('2008-08-01'), moment(), tag);
            labels = chartData.labels;
            var dataset = {};
            Object.assign(dataset, BASE_DATASET, {
                label: tag.name,
                data: chartData.data
            });

            return dataset;
        });

        this.chart && this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                // Boolean - if true, line stack on top of each other along the y axis
                stacked: false,

                hover: {
                    // String - We use a label hover mode since the x axis displays data by the index in the dataset
                    mode: "label"
                },

                scales: {
                    // Defines all of the x axes used in the chart. See the [scale documentation](#getting-started-scales) for details on the available options
                    xAxes: [{
                        // String - type of scale. Built in types are 'category' and 'linear'
                        type: 'category',

                        // String - id of the axis so that data can bind to it
                        id: "x-axis-1", // need an ID so datasets can reference the scale
                    }],

                    // Defines all of the y axes used in the chart.
                    // By default, the line chart uses a linear scale along the y axis
                    yAxes: [{
                        type: 'linear',

                        // String - ID of the axis for data binding
                        id: "y-axis-1",
                    }],
                }
            }
        })
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

    getMatchingTags(query:string) {
        return this.api.getMatchingTags(query);
    }

    matchingTagSelected(tagName:string, typeahead:Typeahead) {
        this.api.getTagByName(tagName)
            .then((tag) => {
                this.tagSearchText = '';
                this.selectedTags.push(tag);
                this.handelSelectedTagChange();
                typeahead.clear();
            })
    }

    removeTag(tag) {
        var tagIndex = this.selectedTags.indexOf(tag);
        if (tagIndex !== -1) {
            this.selectedTags.splice(tagIndex, 1);
            this.handelSelectedTagChange();
        }
    }

    handelSelectedTagChange() {
        this.urlUtil.setSearchParam('tags', this.selectedTags.map(tag => tag.name), false);
        this.rebuildChart(this.selectedTags);
    }
}
