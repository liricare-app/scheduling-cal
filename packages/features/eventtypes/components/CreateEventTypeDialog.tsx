import type { EventType } from "@prisma/client";
import { isValidPhoneNumber } from "libphonenumber-js";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { useOrgBranding } from "@calcom/features/ee/organizations/context/provider";
import { TeamEventTypeForm } from "@calcom/features/ee/teams/components/TeamEventTypeForm";
import { useCreateEventType } from "@calcom/lib/hooks/useCreateEventType";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { useTypedQuery } from "@calcom/lib/hooks/useTypedQuery";
import { MembershipRole, SchedulingType } from "@calcom/prisma/enums";
import { trpc } from "@calcom/trpc/react";
import { Button, Dialog, DialogClose, DialogContent, DialogFooter, showToast } from "@calcom/ui";

import usePostHog from "../../ee/event-tracking/lib/posthog/userPostHog";
import CreateEventTypeForm from "./CreateEventTypeForm";

// this describes the uniform data needed to create a new event type on Profile or Team
export interface EventTypeParent {
  teamId: number | null | undefined; // if undefined, then it's a profile
  membershipRole?: MembershipRole | null;
  name?: string | null;
  slug?: string | null;
  image?: string | null;
}

const locationFormSchema = z.array(
  z.object({
    locationType: z.string(),
    locationAddress: z.string().optional(),
    displayLocationPublicly: z.boolean().optional(),
    locationPhoneNumber: z
      .string()
      .refine((val) => isValidPhoneNumber(val))
      .optional(),
    locationLink: z.string().url().optional(), // URL validates as new URL() - which requires HTTPS:// In the input field
  })
);

const querySchema = z.object({
  eventPage: z.string().optional(),
  teamId: z.union([z.string().transform((val) => +val), z.number()]).optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  length: z.union([z.string().transform((val) => +val), z.number()]).optional(),
  description: z.string().optional(),
  schedulingType: z.nativeEnum(SchedulingType).optional(),
  locations: z
    .string()
    .transform((jsonString) => locationFormSchema.parse(JSON.parse(jsonString)))
    .optional(),
});

export default function CreateEventTypeDialog({
  profileOptions,
}: {
  profileOptions: {
    teamId: number | null | undefined;
    label: string | null;
    image: string | undefined;
    membershipRole: MembershipRole | null | undefined;
  }[];
}) {
  const postHog = usePostHog();
  const { t } = useLocale();
  const router = useRouter();
  const orgBranding = useOrgBranding();

  const {
    data: { teamId, eventPage: pageSlug },
  } = useTypedQuery(querySchema);

  const teamProfile = profileOptions.find((profile) => profile.teamId === teamId);

  const isTeamAdminOrOwner =
    teamId !== undefined &&
    (teamProfile?.membershipRole === MembershipRole.OWNER ||
      teamProfile?.membershipRole === MembershipRole.ADMIN);

  const onSuccessMutation = (eventType: EventType) => {
    router.replace(`/event-types/${eventType.id}${teamId ? "?tabName=team" : ""}`);
    showToast(
      t("event_type_created_successfully", {
        eventTypeTitle: eventType.title,
      }),
      "success"
    );
  };

  const onErrorMutation = (err: string) => {
    showToast(err, "error");
  };

  const SubmitButton = (isPending: boolean) => {
    return (
      <DialogFooter showDivider>
        <DialogClose />
        <Button type="submit" loading={isPending}>
          {t("continue")}
        </Button>
      </DialogFooter>
    );
  };

  const { form, createMutation, isManagedEventType } = useCreateEventType(onSuccessMutation, onErrorMutation);

  const urlPrefix = orgBranding?.fullDomain ?? process.env.NEXT_PUBLIC_WEBSITE_URL;

  const { data: team } = trpc.viewer.teams.get.useQuery(
    { teamId: teamId ?? -1, isOrg: false },
    { enabled: !!teamId }
  );

  return (
    <Dialog
      name="new"
      clearQueryParamsOnClose={[
        "eventPage",
        "teamId",
        "type",
        "description",
        "title",
        "length",
        "slug",
        "locations",
      ]}>
      <DialogContent
        type="creation"
        enableOverflow
        title={teamId ? t("add_new_team_event_type") : t("add_new_event_type")}
        description={t("new_event_type_to_book_description")}>
        <Form
          form={form}
          handleSubmit={(values) => {
            // set centralize price
            values.price = values?.price > 0 ? values.price * 100 : undefined;

            // Call the mutation with the updated values
            createMutation.mutate(values);
          }}>
          <div className="mt-3 space-y-6 pb-11">
            {teamId && (
              <TextField
                type="hidden"
                labelProps={{ style: { display: "none" } }}
                {...register("teamId", { valueAsNumber: true })}
                value={teamId}
              />
            )}
            <TextField
              label={t("title")}
              placeholder={t("quick_chat")}
              data-testid="event-type-quick-chat"
              {...register("title")}
              onChange={(e) => {
                form.setValue("title", e?.target.value);
                if (form.formState.touchedFields["slug"] === undefined) {
                  form.setValue("slug", slugify(e?.target.value));
                }
              }}
            />

            {urlPrefix && urlPrefix.length >= 21 ? (
              <div>
                <TextField
                  label={`${t("url")}: ${urlPrefix}`}
                  required
                  addOnLeading={
                    <Tooltip content={!isManagedEventType ? pageSlug : t("username_placeholder")}>
                      <span className="max-w-24 md:max-w-56">
                        /{!isManagedEventType ? pageSlug : t("username_placeholder")}/
                      </span>
                    </Tooltip>
                  }
                  {...register("slug")}
                  onChange={(e) => {
                    form.setValue("slug", slugify(e?.target.value), { shouldTouch: true });
                  }}
                />

                {isManagedEventType && (
                  <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
                )}
              </div>
            ) : (
              <div>
                <TextField
                  label={t("url")}
                  required
                  addOnLeading={
                    <Tooltip
                      content={`${urlPrefix}/${!isManagedEventType ? pageSlug : t("username_placeholder")}/`}>
                      <span className="max-w-24 md:max-w-56">
                        {urlPrefix}/{!isManagedEventType ? pageSlug : t("username_placeholder")}/
                      </span>
                    </Tooltip>
                  }
                  {...register("slug")}
                />
                {isManagedEventType && (
                  <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
                )}
              </div>
            )}
            {!teamId && (
              <>
                <Editor
                  getText={() => md.render(form.getValues("description") || "")}
                  setText={(value: string) => form.setValue("description", turndown(value))}
                  excludedToolbarItems={["blockType", "link"]}
                  placeholder={t("quick_video_meeting")}
                  firstRender={firstRender}
                  setFirstRender={setFirstRender}
                />

                <div className="relative">
                  <TextField
                    type="number"
                    required
                    min="10"
                    placeholder="15"
                    label={t("duration")}
                    className="pr-4"
                    {...register("length", { valueAsNumber: true })}
                    addOnSuffix={t("minutes")}
                  />
                </div>

                <div className="relative">
                  <TextField
                    type="number"
                    required
                    min="0"
                    placeholder="$100"
                    label="Price"
                    className="pr-4"
                    {...register("price", { valueAsNumber: true })}
                    onChange={(e) => {
                      form.setValue("price", parseInt(e?.target.value, 10));
                    }}
                  />
                </div>
              </>
            )}

            {teamId && (
              <div className="mb-4">
                <label htmlFor="schedulingType" className="text-default block text-sm font-bold">
                  {t("assignment")}
                </label>
                {form.formState.errors.schedulingType && (
                  <Alert
                    className="mt-1"
                    severity="error"
                    message={form.formState.errors.schedulingType.message}
                  />
                )}
                <RadioArea.Group
                  onValueChange={(val: SchedulingType) => {
                    form.setValue("schedulingType", val);
                  }}
                  className={classNames("mt-1 flex gap-4", isAdmin && "flex-col")}>
                  <RadioArea.Item
                    {...register("schedulingType")}
                    value={SchedulingType.COLLECTIVE}
                    className={classNames("w-full text-sm", !isAdmin && "w-1/2")}
                    classNames={{ container: classNames(isAdmin && "w-full") }}>
                    <strong className="mb-1 block">{t("collective")}</strong>
                    <p>{t("collective_description")}</p>
                  </RadioArea.Item>
                  <RadioArea.Item
                    {...register("schedulingType")}
                    value={SchedulingType.ROUND_ROBIN}
                    className={classNames("text-sm", !isAdmin && "w-1/2")}
                    classNames={{ container: classNames(isAdmin && "w-full") }}>
                    <strong className="mb-1 block">{t("round_robin")}</strong>
                    <p>{t("round_robin_description")}</p>
                  </RadioArea.Item>
                  <>
                    {isAdmin && (
                      <RadioArea.Item
                        {...register("schedulingType")}
                        value={SchedulingType.MANAGED}
                        className={classNames("text-sm", !isAdmin && "w-1/2")}
                        classNames={{ container: classNames(isAdmin && "w-full") }}
                        data-testid="managed-event-type">
                        <strong className="mb-1 block">{t("managed_event")}</strong>
                        <p>{t("managed_event_description")}</p>
                      </RadioArea.Item>
                    )}
                  </>
                </RadioArea.Group>
              </div>
            )}
          </div>
          <DialogFooter showDivider>
            <DialogClose />
            <Button type="submit" loading={createMutation.isPending}>
              {t("continue")}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
