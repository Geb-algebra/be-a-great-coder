export default function Button(
  props: {
    className?: string;
    children?: React.ReactNode;
  } & JSX.IntrinsicElements["button"],
) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={`rounded-lg bg-accent-1 text-text-light hover:bg-accent-3 transition-colors duration-300 disabled:bg-gray-400 disabled:text-text-dark ${className}`}
    >
      {props.children}
    </button>
  );
}
