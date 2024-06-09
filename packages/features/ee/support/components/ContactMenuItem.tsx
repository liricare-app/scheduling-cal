import { useHasPaidPlan } from "@calcom/lib/hooks/useHasPaidPlan";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { UpgradeTeamsBadge } from "@calcom/ui";

import FreshChatMenuItem from "../lib/freshchat/FreshChatMenuItem";
import HelpscoutMenuItem from "../lib/helpscout/HelpscoutMenuItem";
import ZendeskMenuItem from "../lib/zendesk/ZendeskMenuItem";

interface ContactMenuItem {
  onHelpItemSelect: () => void;
}

export default function ContactMenuItem(props: ContactMenuItem) {
  const { t } = useLocale();
  const { onHelpItemSelect } = props;
  const { hasPaidPlan } = useHasPaidPlan();
  return (
    <>
      {hasPaidPlan ? (
        <>
          <ZendeskMenuItem onHelpItemSelect={onHelpItemSelect} />
          <HelpscoutMenuItem onHelpItemSelect={onHelpItemSelect} />
          <FreshChatMenuItem onHelpItemSelect={onHelpItemSelect} />
        </>
      ) : (
        <div className=" hover:text-emphasis text-default flex w-full cursor-not-allowed justify-between px-5 py-2 pr-4 text-sm font-medium">
          {t("premium_support")}
          <UpgradeTeamsBadge />
        </div>
      )}
    </>
  );
}
