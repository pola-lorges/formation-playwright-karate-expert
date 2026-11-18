package qa;

import com.intuit.karate.junit5.Karate;

class ApiTest {
    @Karate.Test
    Karate usersFeature() {
        return Karate.run("classpath:features/users");
    }
}
