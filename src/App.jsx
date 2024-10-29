import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { supabase, createEvent } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-solid';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { CodeMirror } from 'solid-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/htmlmixed/htmlmixed.js';

function App() {
  const [user, setUser] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal('login');
  const [websiteRequirements, setWebsiteRequirements] = createSignal('');
  const [generatedWebsite, setGeneratedWebsite] = createSignal('');
  const [editedWebsite, setEditedWebsite] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [previewMode, setPreviewMode] = createSignal(false);

  // Check if user is signed in on mount
  const checkUserSignedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setCurrentPage('homePage');
    }
  };

  onMount(checkUserSignedIn);

  // Listen for auth state changes
  createEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentPage('homePage');
      } else {
        setUser(null);
        setCurrentPage('login');
      }
    });

    return () => {
      authListener.unsubscribe();
    };
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('login');
  };

  const handleGenerateWebsite = async (e) => {
    e.preventDefault();
    if (!websiteRequirements()) return;

    setLoading(true);

    try {
      const result = await createEvent('chatgpt_request', {
        prompt: `من فضلك قم بإنشاء موقع ويب احترافي وكامل بناءً على المتطلبات التالية باللغة العربية، بدون أخطاء. قم بمراجعة وتصحيح أي أخطاء قبل تسليم الكود:

${websiteRequirements()}

يجب أن يكون الموقع بتنسيق HTML كامل ومدعوم بـ CSS، ويحتوي على أقسام منظمة ومرتبة بشكل صحيح.`,
        response_type: 'text'
      });
      setGeneratedWebsite(result);
      setEditedWebsite(result);
      setPreviewMode(false);
    } catch (error) {
      console.error('Error generating website:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="h-full bg-gradient-to-br from-purple-100 to-blue-100 p-4" dir="rtl">
      <Show
        when={currentPage() === 'homePage'}
        fallback={
          <div class="flex items-center justify-center h-full">
            <div class="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
              <h2 class="text-3xl font-bold mb-6 text-center text-purple-600">تسجيل الدخول باستخدام ZAPT</h2>
              <a
                href="https://www.zapt.ai"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline mb-6 block text-center"
              >
                تعرف على المزيد عن ZAPT
              </a>
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google', 'facebook', 'apple']}
                magicLink={true}
                showLinks={false}
                view="magic_link"
              />
            </div>
          </div>
        }
      >
        <div class="max-w-4xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold text-purple-600">منشئ المواقع الاحترافية</h1>
            <button
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
              onClick={handleSignOut}
            >
              تسجيل الخروج
            </button>
          </div>
          <form onSubmit={handleGenerateWebsite} class="space-y-4">
            <textarea
              placeholder="أدخل متطلبات موقع الويب الخاص بك هنا..."
              value={websiteRequirements()}
              onInput={(e) => setWebsiteRequirements(e.target.value)}
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent box-border"
              rows="6"
              required
            />
            <button
              type="submit"
              class={`w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${loading() ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading()}
            >
              {loading() ? 'جارٍ إنشاء الموقع...' : 'إنشاء موقع الويب'}
            </button>
          </form>
          <Show when={generatedWebsite()}>
            <div class="mt-8">
              <h2 class="text-2xl font-bold mb-4 text-purple-600">مراجعة وتصحيح الموقع</h2>
              <div class="flex space-x-4 mb-4">
                <button
                  class={`px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${previewMode() ? '' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => setPreviewMode(false)}
                  disabled={loading() || !previewMode()}
                >
                  تحرير الكود
                </button>
                <button
                  class={`px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${previewMode() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setPreviewMode(true)}
                  disabled={loading() || previewMode()}
                >
                  معاينة الموقع
                </button>
              </div>
              <Show when={!previewMode()}>
                <CodeMirror
                  value={editedWebsite()}
                  onValueChange={(value) => setEditedWebsite(value)}
                  options={{ mode: 'htmlmixed', theme: 'default', lineNumbers: true }}
                />
              </Show>
              <Show when={previewMode()}>
                <iframe
                  srcDoc={editedWebsite()}
                  class="w-full h-[600px] border border-gray-300 rounded-lg"
                  sandbox="allow-scripts allow-same-origin"
                ></iframe>
              </Show>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

export default App;