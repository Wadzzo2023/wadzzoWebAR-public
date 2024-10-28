import { useEffect, useState } from "react";
import DeleteCollectionModal from "../modals/Delete-Collection-Modal";
import LocationInformationModal from "../modals/Location-Info-Modal";
import JoinBountyModal from "../modals/Join-Bounty-Modal";
import NearbyPinModal from "../modals/NearBy-Pin-Modal";

const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <JoinBountyModal />
      <DeleteCollectionModal />
      <LocationInformationModal />
      <NearbyPinModal />
    </>
  );
};

export default ModalProvider;
