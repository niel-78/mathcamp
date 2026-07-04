export default function OptionList({ options }) {

    return (
        <ul>
            {options.map(option => (
                <li key={option.id}>
                    {option.text}
                </li>
            ))}
        </ul>
    );
}
