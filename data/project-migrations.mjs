// Apply reviewed corrections only to the original revisions; owner edits take priority.
const corrections = {
  "5d79491a-d258-4129-bc94-b6426d34beff": {
    "updatedAt": "2026-11-19T11:32:14.303Z",
    "changes": {
      "objectType": "office",
      "service": "remont-ofisiv",
      "workTypes": [
        "maliarni-roboty",
        "plytkovi-roboty",
        "elektromontazhni-roboty"
      ],
      "photoWorkTypes": {
        "/.netlify/functions/site-api?action=media&id=d53ec257-f970-4e13-8649-e0cc62bb1682.jpg": [
          "maliarni-roboty",
          "elektromontazhni-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=c3cb0399-58c0-46f1-ad3a-c9702f5204b5.jpg": [
          "maliarni-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=4e5e5b0e-fadf-4360-a465-08b2e5f79b4c.jpg": [
          "maliarni-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=b50897e0-e7c2-4055-adfa-ae27c516099c.jpg": [
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=1e7afec6-3951-4416-948a-ae37532b52a8.jpg": [
          "maliarni-roboty"
        ]
      }
    }
  },
  "8d343d2c-d7e6-43fa-a0ea-5b0f19b8219b": {
    "updatedAt": "2026-11-19T11:31:50.427Z",
    "changes": {
      "title": "Дендропарковий — внутрішнє оздоблення"
    }
  },
  "6c59e9eb-23fb-4b84-9b17-9ed5a93b6687": {
    "updatedAt": "2026-11-19T06:55:53.480Z",
    "changes": {
      "title": "Дендропарковий — мурування та штукатурка"
    }
  },
  "55cee339-6498-4cbc-8b67-ff8430c34860": {
    "updatedAt": "2026-11-16T14:36:28.725Z",
    "changes": {
      "objectType": "retail",
      "service": "remont-mahazyniv-bankiv",
      "workTypes": [
        "demontazhni-roboty",
        "plytkovi-roboty",
        "maliarni-roboty",
        "elektromontazhni-roboty"
      ],
      "photoWorkTypes": {
        "/.netlify/functions/site-api?action=media&id=c271e020-03ae-45ab-8350-2d461fcfdb7d.jpg": [
          "maliarni-roboty",
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=efcfd005-97a2-4819-9060-06f9d35e4933.jpg": [
          "maliarni-roboty",
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=0cb76af6-9fc5-4102-9fcd-2a986bdff599.jpg": [
          "maliarni-roboty",
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=0bedb599-61be-49ca-aefe-0ec9757caab5.jpg": [
          "maliarni-roboty",
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=c313b8e3-882f-4929-ab5f-f5e6e1acce1b.jpg": [
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=2ab4938c-26de-463f-a172-8515cf538a5c.jpg": [
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=b0cd2fcd-1ea5-4b56-962e-3fdb35b45331.jpg": [
          "maliarni-roboty",
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=f223312c-1b2c-4db7-a9e4-c2a8fdf6f71a.jpg": [
          "maliarni-roboty",
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=f5998ea8-582a-45d6-aaeb-f5ead3eb0298.jpg": [
          "maliarni-roboty",
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=4ea92812-161c-4c9e-b47d-9ff72239e285.jpg": [
          "maliarni-roboty",
          "plytkovi-roboty"
        ]
      }
    }
  },
  "f7b210c6-3815-48c6-83ff-8c114930ec44": {
    "updatedAt": "2026-11-12T15:12:37.631Z",
    "changes": {
      "objectType": "beauty",
      "service": "remont-saloniv-krasy",
      "workTypes": [
        "maliarni-roboty",
        "plytkovi-roboty",
        "elektromontazhni-roboty"
      ],
      "photoWorkTypes": {
        "/.netlify/functions/site-api?action=media&id=49339f11-e592-430b-ad59-e92babfaed31.jpg": [
          "maliarni-roboty",
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=8aebfce7-8f1e-4538-a8ec-2d24911ec04e.jpg": [
          "plytkovi-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=3776d877-09a2-44b4-9602-3aecf0bda057.jpg": [
          "maliarni-roboty"
        ],
        "/.netlify/functions/site-api?action=media&id=d5681cbf-2b43-4051-a80c-433cf5683b18.jpg": [
          "maliarni-roboty"
        ]
      }
    }
  }
};
export function withPortfolioDetails(project) {
 if (!project) return project;
 const correction=corrections[project.id];
 return correction?.updatedAt===project.updatedAt ? {...project,...correction.changes} : project;
}
