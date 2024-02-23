export default function Input(props: {
  name: string;
  label: string;
  id: string;
  type: string;
  autofocus?: boolean;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  value?: string;
}) {
  return (
    <div className="w-full">
      <label htmlFor={props.name}>{props.label}</label>
      <input
        className={'w-full border px-2 py-1 h-10 rounded-lg ' + (props.className ?? '')}
        autoFocus={props.autofocus ?? false}
        name={props.name}
        id={props.id}
        type={props.type}
        disabled={props.disabled ?? false}
        readOnly={props.readonly ?? false}
        value={props.value}
      />
    </div>
  );
}
