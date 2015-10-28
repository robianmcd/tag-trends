import {Component, View} from 'angular2/core';
import {Typeahead} from "../typeahead/typeahead";

@Component({
    selector: 'app'
})
@View({
    template: `
        <div>Hello World</div>
        <typeahead [get-matches]="getMatchingTags" (match-selected)="matchingTagSelected($event)"></typeahead>
        <div>
            <canvas id="myChart" width="400" height="400"></canvas>
        </div>
    `,
    directives: [Typeahead]
})
export class App {
    typeahead;

    constructor() {

    }

    generateArray(startDate, endDate, tag) {
        var curDate = moment(startDate);

        var labels = [];

        while(curDate.isBefore(endDate)) {
            labels.push(curDate.format('YYYY-MM'));
            curDate.add(1, 'month');
        }

        var data = labels.map(function (label) {
            if(tag.usageByMonth[label]) {
               return tag.usageByMonth[label].numQuestions;
            } else {
                return 0;
            }
        });

        return {data: data, labels: labels};
    }

    getMatchingTags(query) {
        return window.fetch(`api/tags?matchName=${encodeURIComponent(query)}&max=10`).then(res => res.json());
    }

    matchingTagSelected(tagName) {
        window.fetch(`api/tagByName/${encodeURIComponent(tagName)}`)
            .then(res => res.json())
            .then((tagData) => {
                //this.tagData = tagData;

                var chartData = this.generateArray(moment('2008-08-01'), moment(), tagData);

                var ctx = document.getElementById("myChart");
                var lineChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.labels,
                        datasets: [
                            {
                                label: "My First dataset",

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

                                // The actual data
                                data: chartData.data,

                                // String - If specified, binds the dataset to a certain y-axis. If not specified, the first y-axis is used.
                                yAxisID: "y-axis-1",
                            }
                        ]
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
            })
    }
}
