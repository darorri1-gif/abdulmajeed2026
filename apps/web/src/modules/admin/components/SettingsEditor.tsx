import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Switch } from '@/shared/ui/Switch';
import { Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { useSettings, useUpsertSetting } from '../admin.hooks';
import type { AppSetting } from '../data/admin-system.api';

function SettingRow({ setting }: { setting: AppSetting }) {
  const upsert = useUpsertSetting();
  const toast = useToast();
  const isBool = typeof setting.value === 'boolean';
  const initial = isBool ? '' : typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value);
  const [text, setText] = useState(initial);

  function save(value: unknown) {
    upsert.mutate({ key: setting.key, value }, { onSuccess: () => toast.success('تم حفظ الإعداد.') });
  }

  function saveText() {
    let value: unknown = text;
    try {
      value = JSON.parse(text);
    } catch {
      value = text; // store as a plain string
    }
    save(value);
  }

  return (
    <div className="flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs text-heading" dir="ltr">
          {setting.key}
        </p>
      </div>
      {isBool ? (
        <Switch checked={setting.value as boolean} onCheckedChange={(v) => save(v)} />
      ) : (
        <div className="flex items-center gap-2">
          <Input className="h-9 w-40" dir="ltr" value={text} onChange={(e) => setText(e.target.value)} />
          <Button size="sm" variant="secondary" onClick={saveText} loading={upsert.isPending} disabled={text === initial}>
            حفظ
          </Button>
        </div>
      )}
    </div>
  );
}

export function SettingsEditor() {
  const { data: settings, isLoading } = useSettings();
  const upsert = useUpsertSetting();
  const toast = useToast();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  function addSetting() {
    if (!newKey.trim()) return;
    let value: unknown = newValue;
    try {
      value = JSON.parse(newValue);
    } catch {
      value = newValue;
    }
    upsert.mutate(
      { key: newKey.trim(), value },
      {
        onSuccess: () => {
          toast.success('تمت إضافة الإعداد.');
          setNewKey('');
          setNewValue('');
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        الإعدادات العامة والبريد وأعلام الميزات مخزّنة كأزواج مفتاح/قيمة تقرأها الوحدات المعنية.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {settings?.map((s) => <SettingRow key={s.key} setting={s} />)}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-4">
          <p className="mb-2 text-sm font-medium text-heading">إضافة إعداد</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input dir="ltr" placeholder="key (e.g. email.from_name)" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
            <Input dir="ltr" placeholder='value (e.g. "ثانوية الأمير" or true)' value={newValue} onChange={(e) => setNewValue(e.target.value)} />
            <Button className="shrink-0" onClick={addSetting} loading={upsert.isPending} disabled={!newKey.trim()}>
              <Plus className="h-4 w-4" />
              إضافة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
