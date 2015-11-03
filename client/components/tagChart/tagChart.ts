import {Component, View, Input, Output, EventEmitter} from 'angular2/core';
import {Tag} from "../../models/tag";
import Moment = moment.Moment;

declare var c3:any;

@Component({
    selector: 'tag-chart',
    providers: []
})
@View({
    directives: [],
    template: `
        <div id="chart"></div>
    `
})
export class TagChart {
    @Input() tags:Tag[];
    @Input() colors:string[];

    private startDate:Moment;
    private endDate:Moment;
    private chart;
    private labels:string[];

    constructor() {

    }

    createForRange(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;

        this.labels = this.generateLabels(this.startDate, this.endDate);

        this.chart = c3.generate({
            data: {
                bindto: '#chart',
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
                enabled: true,
                rescale: true
            },
            point: {
                show: true,
                r: 0,
                focus: {
                    expand: {
                        r: 5
                    }
                }
            }
        });
        this.tags.forEach((tag) => {
            this.addTagToChart(tag);
        });
    }

    addTagToChart(tag:Tag) {
        var numQuestionsArray = this.generateNumQuestionsArray(tag);
        var series = (<any>[tag.name]).concat(numQuestionsArray);

        //For some reason the labels can't be added to the chart until there is another column to add to the chart so
        // /we're just adding it every time another tag is added.
        this.chart.load({
            columns: [
                ['x'].concat(this.labels),
                series
            ]
        });
        this.updateColors();

    }

    removeTagFromChart(tag:Tag) {
        this.chart.unload({
            ids: [tag.name]
        });
        this.updateColors();
    }

    updateColors() {
        var colors = {};
        this.tags.forEach(
            (tag, index) => {
                colors[tag.name] = this.colors[index];
            });
        this.chart.data.colors(colors);
    }

    private generateNumQuestionsArray(tag:Tag) {
        return this.labels.map(function (label) {
            if (tag.usageByMonth[label]) {
                return tag.usageByMonth[label].numQuestions;
            } else {
                return 0;
            }
        });
    }

    private generateLabels(startDate:Moment, endDate:Moment) {
        var curDate = moment(startDate);

        var labels = [];

        while (curDate.isBefore(endDate)) {
            labels.push(curDate.format('YYYY-MM'));
            curDate.add(1, 'month');
        }

        return labels;
    }
}