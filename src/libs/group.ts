export interface GroupAdminStatus {
  isGroup: boolean;
  isBotAdmin: boolean;
  isBotSuperAdmin: boolean;
  botJid: string;
}

function normalizeJid(jid: string): string {
  return (jid || "").replace(/[^0-9]/g, "");
}

function participantIsAdmin(participant: any): { admin: boolean; superAdmin: boolean } {
  const adminField = participant?.admin;

  if (adminField === "superadmin") return { admin: true, superAdmin: true };
  if (adminField === "admin") return { admin: true, superAdmin: false };
  if (participant?.isSuperAdmin) return { admin: true, superAdmin: true };
  if (participant?.isAdmin) return { admin: true, superAdmin: false };

  return { admin: false, superAdmin: false };
}

export async function getBotAdminStatus(sock: any, chatId: string): Promise<GroupAdminStatus> {
  const botJid: string = sock.user.id.split(":")[0];
  const isGroup = chatId.endsWith("@g.us");

  if (!isGroup) {
    return { isGroup: false, isBotAdmin: false, isBotSuperAdmin: false, botJid };
  }

  const groupMetadata = await sock.groupMetadata(chatId);
  const participants: any[] = groupMetadata?.participants || [];

  const botParticipant = participants.find(
    (p) => normalizeJid(p?.id) === normalizeJid(botJid)
  );

  const { admin, superAdmin } = participantIsAdmin(botParticipant);

  return { isGroup: true, isBotAdmin: admin, isBotSuperAdmin: superAdmin, botJid };
}
