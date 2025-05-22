import React from "react";
import HomeScreenOfferListItem from "./list.item";

const ListHomeScreenOffers = ({
  homeScreenOffers,
  setHomeScreenOffers,
}: {
  homeScreenOffers: any;
  setHomeScreenOffers: any;
}) => {
  return (
    <div>
      <ul className="mt-[1rem]">
        {typeof homeScreenOffers !== "undefined" &&
          homeScreenOffers?.map((offer: any) => (
            <HomeScreenOfferListItem
              offer={offer}
              key={offer._id}
              setOffers={setHomeScreenOffers}
            />
          ))}
      </ul>
    </div>
  );
};

export default ListHomeScreenOffers;
