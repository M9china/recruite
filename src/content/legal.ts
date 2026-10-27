/**
 * Legal page structure only. Every body is a placeholder: the final text must be
 * written or approved by the client's legal adviser. The privacy policy and
 * data-processing notice outlines follow the topics POPIA requires a
 * responsible party to address (sections 17 and 18 of the Act).
 */
export type LegalDoc = { title: string; lede: string; sections: string[] };

export const legalContent: Record<string, LegalDoc> = {
  privacy: {
    title: "Privacy policy",
    lede: "How the organisation collects, uses and protects personal information on this website.",
    sections: [
      "Who is responsible for your information",
      "What information we collect",
      "Why we collect it",
      "The legal basis for processing",
      "Who we share it with",
      "Transfers outside South Africa",
      "How long we keep it",
      "How we protect it",
      "Your rights",
      "Our Information Officer",
      "Complaints to the Information Regulator",
      "Changes to this policy",
    ],
  },
  "data-processing": {
    title: "Recruitment data-processing notice",
    lede: "What happens to the information you give us when you apply.",
    sections: [
      "Information collected in your application",
      "Purpose of processing",
      "Whether providing information is voluntary or required",
      "Consequences of not providing information",
      "Verification and background checks",
      "Who can see your application",
      "Retention after the recruitment process",
      "Your right to access and correct your information",
      "Contact details of the Information Officer",
    ],
  },
  terms: {
    title: "Terms of use",
    lede: "The conditions for using this website.",
    sections: ["Use of this website", "Accuracy of information", "Applications", "Links to other websites", "Changes to these terms", "Governing law"],
  },
  cookies: {
    title: "Cookie information",
    lede: "Which cookies this website uses and why.",
    sections: ["What cookies are", "Cookies we use", "Managing cookies"],
  },
};
