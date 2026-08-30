const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-4xl font-bold">
          Privacy Policy
        </h1>

        <p className="mb-8 text-gray-600">
          Last updated: August 30, 2026
        </p>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">
            1. Introduction
          </h2>
          <p>
            ReachInbox Email Scheduler ("we", "our", or "the application")
            provides tools for scheduling and managing email campaigns.
            This Privacy Policy explains how we collect, use, store, and
            protect information when you use our application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">
            2. Information We Collect
          </h2>
          <p>
            When you sign in using Google, we may receive information
            permitted by the Google OAuth permissions you authorize,
            such as your name, email address, and profile information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Authenticate you and maintain your account.</li>
            <li>Provide email scheduling and campaign functionality.</li>
            <li>Manage scheduled and sent emails.</li>
            <li>Provide search and management functionality.</li>
            <li>Maintain and improve the application.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">
            4. Google User Data
          </h2>
          <p>
            If you use Google Sign-In or authorize access to Google
            services, we use Google user data only to provide the
            functionality requested by you.
          </p>
          <p className="mt-3">
            We do not sell Google user data or use it for targeted
            advertising.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">
            5. Data Storage and Security
          </h2>
          <p>
            Account and application data may be stored on third-party
            infrastructure providers used to operate the application.
            We take reasonable measures to protect stored information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">
            6. Data Retention and Deletion
          </h2>
          <p>
            We retain information for as long as reasonably necessary
            to provide the application's functionality. You may request
            deletion of your account and associated personal information
            by contacting us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">
            7. Third-Party Services
          </h2>
          <p>
            The application may use third-party services for
            authentication, hosting, databases, search, email delivery,
            and other infrastructure required to operate the application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold">
            8. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time.
            Changes will be reflected on this page with an updated
            revision date.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            9. Contact Us
          </h2>
          <p>
            If you have questions about this Privacy Policy, contact us at:
          </p>

          <p className="mt-3 font-medium">
            ekantkumar031@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;