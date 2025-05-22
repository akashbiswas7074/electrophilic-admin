import React from "react";
import TopBarListItem from "./list.item";

const ListAllTopBars = ({
  topBars,
  setTopBars,
}: {
  topBars: any;
  setTopBars: React.Dispatch<React.SetStateAction<any>>;
}) => {
  return (
    <div>
      <ul className="mt-[1rem]">
        {topBars?.map((topBar: any) => (
          <TopBarListItem
            topBar={topBar}
            key={topBar._id}
            setTopBars={setTopBars}
          />
        ))}
      </ul>
    </div>
  );
};

export default ListAllTopBars;
