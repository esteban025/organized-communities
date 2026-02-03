import type { CommunityWithBrotherCount } from "@/types/communities";
import { useEffect, useState } from "react";

interface SelectedCommunity
  extends Pick<
    CommunityWithBrotherCount,
    "id" | "number_community" | "count_persons"
  > { }

export const ViewSelectedCommunities = () => {
  const [selectedCommunities, setSelectedCommunities] = useState<
    SelectedCommunity[]
  >([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        communities: SelectedCommunity[];
      }>;
      setSelectedCommunities(customEvent.detail.communities || []);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("retreat:communities-selected", handler);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("retreat:communities-selected", handler);
      }
    };
  }, []);

  if (selectedCommunities.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Ninguna comunidad seleccionada todavía.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {selectedCommunities.map((community) => (
        <li key={community.id} className="text-sm">
          Comunidad {community.number_community} ({community.count_persons} personas)
        </li>
      ))}
    </ul>
  );
};
