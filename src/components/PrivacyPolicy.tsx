export function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-2 text-violet-700">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: April 28, 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
        <p className="leading-relaxed">
          80HD ("we," "us," or "our") is an ADHD productivity app designed to help people capture tasks,
          plan their days, and build momentum. This Privacy Policy explains what information we collect,
          how we use it, and your rights regarding that information. By using 80HD, you agree to the
          practices described here.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
        <h3 className="font-medium mb-2">Information You Provide</h3>
        <ul className="list-disc ml-6 mb-4 leading-relaxed space-y-1">
          <li>
            <strong>Task data:</strong> The tasks, notes, and scheduling information you enter into the
            app (stored locally in your browser via localStorage).
          </li>
          <li>
            <strong>Settings and preferences:</strong> Display preferences and app configuration you set
            within the app (stored locally).
          </li>
        </ul>

        <h3 className="font-medium mb-2">Information Collected Automatically</h3>
        <ul className="list-disc ml-6 leading-relaxed space-y-1">
          <li>
            <strong>Usage data:</strong> General information about how you interact with the app, such as
            which features you use and session frequency. This data is aggregated and not linked to any
            personal identifier.
          </li>
          <li>
            <strong>Device information:</strong> Browser type, operating system version, and screen
            resolution, used only to ensure the app renders correctly.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc ml-6 leading-relaxed space-y-1">
          <li>To provide and maintain the 80HD service.</li>
          <li>To improve app features, performance, and user experience.</li>
          <li>To diagnose technical issues and bugs.</li>
          <li>To communicate with you if you contact us directly.</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          We do <strong>not</strong> sell your personal information to third parties. We do not use your
          task data for advertising or share it with advertisers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Local Storage and Cookies</h2>
        <p className="leading-relaxed mb-3">
          80HD stores your tasks and preferences in your browser's <strong>localStorage</strong>. This
          data lives entirely on your device and is not transmitted to our servers. Clearing your
          browser data or using a different browser or device will result in data not being available
          in that context.
        </p>
        <p className="leading-relaxed">
          We may use minimal session cookies or browser storage for technical purposes (e.g., maintaining
          app state). We do not use tracking cookies or third-party advertising cookies.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
        <p className="leading-relaxed">
          80HD may integrate with or be accessed through third-party platforms (such as TikTok for
          promotional or login features). When you interact with those platforms, their own privacy
          policies apply. We encourage you to review the privacy policies of any third-party services
          you use in conjunction with 80HD.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
        <p className="leading-relaxed">
          Because your task data is stored locally in your browser, you control its retention. You can
          delete your data at any time by clearing your browser's localStorage or using the app's
          settings. If you contact us, we will retain correspondence only as long as necessary to resolve
          your inquiry.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
        <p className="leading-relaxed">
          80HD is not directed to children under the age of 13. We do not knowingly collect personal
          information from children. If you believe a child has provided us with personal information,
          please contact us and we will promptly delete it.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Security</h2>
        <p className="leading-relaxed">
          We take reasonable measures to protect the information we handle. However, no method of
          transmission over the internet or electronic storage is 100% secure. Because your primary
          data is stored locally on your device, its security also depends on your device and browser
          security settings.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
        <p className="leading-relaxed">
          We may update this Privacy Policy from time to time. When we do, we will update the "Last
          updated" date at the top of this page. Continued use of 80HD after changes are posted
          constitutes your acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
        <p className="leading-relaxed">
          If you have questions or concerns about this Privacy Policy, please contact us at:{' '}
          <a href="mailto:we80hd@gmail.com" className="text-violet-600 underline">
            we80hd@gmail.com
          </a>
        </p>
      </section>
    </div>
  )
}
