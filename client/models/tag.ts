export interface Tag {
    _id: string;
    name: string;
    totalQuestions: number;
    usageByMonth: {[monthLabel: string] : TagUsage};
    usageByWeek: {[weekLabel: string] : TagUsage};
}

interface TagUsage {
    numQuestions: Number;
}