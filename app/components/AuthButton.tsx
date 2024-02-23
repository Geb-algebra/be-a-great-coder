export default function AuthButton(props: {
  type?: 'button' | 'submit' | 'reset' | undefined;
  formMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | undefined;
  disabled?: boolean;
  value?: string;
  name?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type={props.type}
      formMethod={props.formMethod}
      name={props.name}
      disabled={props.disabled}
      className="bg-black text-white hover:bg-gray-700  focus:bg-gray-700 disabled:bg-gray-400 w-full py-2 px-4 rounded-lg"
      onClick={props.onClick}
      value={props.value}
    >
      {props.children}
    </button>
  );
}
