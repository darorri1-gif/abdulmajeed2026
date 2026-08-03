import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Save } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { useToast } from '@/shared/ui/toast';

export function MyProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const toast = useToast();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [specialization, setSpecialization] = useState(profile?.specialization ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? '');
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  async function save() {
    if (fullName.trim().length < 3) {
      toast.error('أدخل الاسم الثلاثي.');
      return;
    }
    setSaving(true);
    const patch = {
      full_name: fullName.trim(),
      username: username.trim() || null,
      specialization: specialization.trim(),
      phone: phone.trim() || null,
      job_title: jobTitle.trim() || null,
    };
    const { error } = await supabase.from('profiles').update(patch).eq('id', profile!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'اسم المستخدم مستخدم مسبقًا.' : 'تعذّر حفظ التعديلات.');
      return;
    }
    setProfile({ ...profile!, ...patch });
    toast.success('تم حفظ الملف الشخصي.');
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-heading">ملفي الشخصي</h1>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">البيانات</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full_name">الاسم الثلاثي</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="email">البريد الالكتروني (غير قابل للتعديل)</Label>
            <Input id="email" dir="ltr" value={profile.email} readOnly disabled />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input id="username" dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="specialization">التخصص</Label>
              <Input id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">الجوال</Label>
              <Input id="phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="job_title">المسمى الوظيفي</Label>
              <Input id="job_title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
          </div>

          <div className="pt-1">
            <Button onClick={save} loading={saving}>
              <Save className="h-4 w-4" />
              حفظ التعديلات
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">الأمان</h2>
        </CardHeader>
        <CardContent>
          <Link
            to="/change-password"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-5 text-sm font-medium text-heading hover:bg-background"
          >
            <KeyRound className="h-4 w-4" />
            تغيير كلمة المرور
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
