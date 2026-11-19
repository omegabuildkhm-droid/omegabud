const portfolioDescriptions = new Map([
  ['6c59e9eb-23fb-4b84-9b17-9ed5a93b6687', {
    updatedAt: '2026-11-19T06:55:53.480Z',
    description: 'У приватному будинку в мікрорайоні Дендропарковий виконали мурування стін із керамоблоку та цегли. Окреме приміщення звели з газоблоку. Внутрішні стіни підготували до подальшого оздоблення машинною штукатуркою. У галереї видно кладку та стіни після штукатурення.'
  }],
  ['55cee339-6498-4cbc-8b67-ff8430c34860', {
    updatedAt: '2026-11-16T14:36:28.725Z',
    description: 'Виконали ремонт відділення ПриватБанку під ключ — від демонтажу до фінішного оздоблення. Влаштували стяжку підлоги, уклали плитку, виконали малярні, електромонтажні та сантехнічні роботи. Змонтували підвісні стелі грильято.'
  }],
  ['5d79491a-d258-4129-bc94-b6426d34beff', {
    updatedAt: '2026-11-19T11:08:36.854Z',
    description: 'Виконали повний комплекс ремонтних робіт в офісних приміщеннях під ключ. У галереї — відкритий робочий простір, кабінет, коридор та санвузол після ремонту.'
  }],
  ['f7b210c6-3815-48c6-83ff-8c114930ec44', {
    updatedAt: '2026-11-12T15:12:37.631Z',
    description: 'Виконали ремонт салону краси під ключ. Провели електромонтажні та сантехнічні роботи, уклали плитку, виконали малярні роботи й нанесли декоративну штукатурку. У галереї — оздоблення головного залу та санвузол із візерунковою підлогою.'
  }]
]);

// Apply the initial copy only to the existing revisions with empty descriptions.
// A subsequent admin save owns the field, including an intentional empty value.
export function withPortfolioDescription(project) {
  if (!project || project.description) return project;
  const initial = portfolioDescriptions.get(project.id);
  if (!initial || initial.updatedAt !== project.updatedAt) return project;
  return {...project, description: initial.description};
}
