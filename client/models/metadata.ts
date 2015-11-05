import Moment = moment.Moment;

export class Metadata {
    totalQuestions: number;
    firstPostDate: Moment;
    lastPostDate: Moment;
    usageByMonth: {[monthLabel: string] : TagUsage};
    usageByWeek: {[weekLabel: string] : TagUsage};

    constructor(apiMetadata) {
        this.totalQuestions = apiMetadata.totalQuestions;
        this.firstPostDate = moment(apiMetadata.firstPostDate);
        this.lastPostDate = moment(apiMetadata.lastPostDate);
        this.usageByMonth = apiMetadata.usageByMonth;
        this.usageByWeek = apiMetadata.usageByWeek;
    }
}

interface TagUsage {
    numQuestions: number;
}