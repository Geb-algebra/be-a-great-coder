/**
 * Overlay is a component that renders a full-screen backdrop that can be used
 *
 * You should define State `isShown` at the parent component and pass it and its Hook to this
 *
 * You also set `onClick={(e) => e.stopPropagation()}` to the top element of the overlay
 * so that clicking on the element does not close the overlay
 *
 * ```
 * const [isShown, setIsShown] = useState(false);
 *
 * return (
 *   <>
 *     <Overlay isShown={isShown} setIsShown={setIsShown}>
 *       // anything you want to render as the overlay
 *       // you should set onClick={(e) => e.stopPropagation()} to the top element
 *     <Overlay />
 *     // normal page content
 *   </>
 * )
 * ```
 */
export default function Overlay(props: {
  isShown: boolean;
  setIsShown: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {props.isShown ? (
        <div
          className="fixed left-0 top-0 w-full h-screen backdrop-brightness-50 z-50 flex place-content-center"
          onClick={() => props.setIsShown(false)}
          onKeyDown={(e) => e.key === "Escape" && props.setIsShown(false)}
        >
          <div className="my-auto" onClick={(e) => e.stopPropagation()} onKeyDown={() => {}}>
            {props.children}
          </div>
        </div>
      ) : null}
    </>
  );
}
