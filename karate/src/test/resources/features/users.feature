Feature: Users API

  Background:
    * url baseUrl

  Scenario: List users
    Given path 'users'
    When method get
    Then status 200
    And match response == '#[]'
    And assert response.length > 0
