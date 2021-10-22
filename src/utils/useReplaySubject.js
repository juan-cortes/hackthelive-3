import { ReplaySubject, Observable } from "rxjs";
import { useEffect, useState } from "react";

export default function useReplaySubject(value){
  const [subject] = useState(() => new ReplaySubject());
  useEffect(() => {
    subject.next(value);
  }, [subject, value]);
  useEffect(() => {
    return () => {
      subject.complete();
    };
  }, [subject]);
  return subject;
}