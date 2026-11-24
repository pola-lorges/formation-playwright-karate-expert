# language: en
@J08 @regression
Feature: Affichage des clients avec des données simulées
  Scenario Outline: Afficher <nom> à <ville>
    Then le client simulé administrateur "<id>" nommé "<nom>" à "<ville>" dans "<pays>" est affiché

    Examples:
      | id              | nom               | ville      | pays     |
      | mock-client-001 | QA Client Alpha   | Bafoussam  | Cameroun |
      | mock-client-002 | QA Client Bravo   | Douala     | Cameroun |
      | mock-client-003 | QA Client Charlie | Yaounde    | Cameroun |
      | mock-client-004 | QA Client Delta   | Garoua     | Cameroun |
      | mock-client-005 | QA Client Echo    | Maroua     | Cameroun |
      | mock-client-006 | QA Client Foxtrot | Bamenda    | Cameroun |
      | mock-client-007 | QA Client Golf    | Bertoua    | Cameroun |
      | mock-client-008 | QA Client Hotel   | Ebolowa    | Cameroun |
      | mock-client-009 | QA Client India   | Ngaoundere | Cameroun |
      | mock-client-010 | QA Client Juliet  | Kribi      | Cameroun |