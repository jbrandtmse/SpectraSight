Class SpectraSight.Model.Bug Extends SpectraSight.Model.Ticket
{

Property Severity As %String(%JSONFIELDNAME = "severity", VALUELIST = ",Low,Medium,High,Critical");

Property StepsToReproduce As %String(%JSONFIELDNAME = "stepsToReproduce", MAXLEN = 32000);

Property ExpectedBehavior As %String(%JSONFIELDNAME = "expectedBehavior", MAXLEN = 32000);

Property ActualBehavior As %String(%JSONFIELDNAME = "actualBehavior", MAXLEN = 32000);

Storage Default
{
<Data name="BugDefaultData">
<Subscript>"Bug"</Subscript>
<Value name="1">
<Value>Severity</Value>
</Value>
<Value name="2">
<Value>StepsToReproduce</Value>
</Value>
<Value name="3">
<Value>ExpectedBehavior</Value>
</Value>
<Value name="4">
<Value>ActualBehavior</Value>
</Value>
</Data>
<DefaultData>BugDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}
