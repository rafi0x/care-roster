const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const shortFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const numberFmt = new Intl.NumberFormat('en');

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatShortDate = (iso: string) => shortFmt.format(new Date(iso));
export const formatNumber = (n: number) => numberFmt.format(n);

/** "+8801712345678" -> "+880 1712-345678"; anything unrecognised is shown as typed. */
export const formatPhone = (phone: string) => phone.replace(/^\+880(1\d{3})(\d{6})$/, '+880 $1-$2');
