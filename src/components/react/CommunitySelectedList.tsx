import { useEffect, useState } from "react";
import type { CommunityWithBrotherCount } from "@/types/communities";

type CatechistCommunitiesEventDetail = {
  communities: CommunityWithBrotherCount[];
};

export const CommunitySelectedList = () => {
  const [communities, setCommunities] = useState<CommunityWithBrotherCount[]>([]);

  useEffect(() => {
    const handler = (
      event: Event,
    ) => {
      const custom = event as CustomEvent<CatechistCommunitiesEventDetail>;
      const next = custom.detail?.communities ?? [];
      setCommunities(next);
    };

    window.addEventListener("catechist:communities-changed", handler as EventListener);
    return () => {
      window.removeEventListener("catechist:communities-changed", handler as EventListener);
    };
  }, []);

  if (!communities.length) {
    return (
      <p className="text-sm text-neutral-500 text-center">
        Aún no has seleccionado comunidades.
      </p>
    );
  }

  return (
    <ul className="space-y-1 text-sm">
      {communities.map((community) => (
        <li
          key={community.id}
          className="flex items-center justify-between bg-neutral-100 px-4 py-2 rounded-full"
        >
          <span className="font-medium">Comunidad {community.number_community}</span>
          <span className="text-neutral-600">
            {community.responsable || "Sin responsable"}
          </span>
        </li>
      ))}
    </ul>
  );
};
