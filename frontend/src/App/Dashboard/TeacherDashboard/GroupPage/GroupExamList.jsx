import GroupExamCard from "./GroupExamList/GroupExamCard";

export default function GroupExamList({ group, onChanged }) {

    return (
        <div>

            <h3>Prov</h3>

            {group.groupExams.map(exam => (
                <GroupExamCard
                    key={exam.id}
                    groupExam={exam}
                    onChanged={onChanged}
                />
            ))}

        </div>
    );
}