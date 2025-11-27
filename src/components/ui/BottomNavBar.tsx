import { Link } from "@tanstack/react-router";
import { clsx } from "clsx";
import navigation from "@/lib/constants/navigationLinks";
const BottomNavBar = ({ activePath }: { activePath: string }) => {
  return (
    <div className="sticky bottom-[10px] bg-neutral-800 rounded-full p-3 border-t border-neutral-600/50 shadow-[0_0_12px_12px_#00000085]">
      <ul className="flex justify-around ">
        {/* <li>
          <Link to="/timeline" className="flex items-center px-4">
            <SquareChartGantt className="mr-2 h-5 w-5" />
            Timeline
          </Link>
        </li> */}
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={clsx(
                  "flex flex-col items-center px-2 justify-center  text-[10px] hover:bg-neutral-800 gap-1 ",
                  item.path === activePath ? "opacity-100" : "opacity-60"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BottomNavBar;
