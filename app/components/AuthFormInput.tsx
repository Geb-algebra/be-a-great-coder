export default function Input(props: {
  name: string;
  label: string;
  id: string;
  type: string;
  autofocus?: boolean;
  className?: string;
  disabled?: boolean;
  value?: string;
}) {
  return (
    <div className="w-full">
      <label htmlFor={props.name}>{props.label}</label>
      <input
        autoFocus={props.autofocus ?? false}
        name={props.name}
        id={props.id}
        type={props.type}
        className={'w-full border px-2 py-1 h-10 rounded-lg ' + props.className ?? ''}
        disabled={props.disabled ?? false}
        value={props.value}
      />
    </div>
  );
}
